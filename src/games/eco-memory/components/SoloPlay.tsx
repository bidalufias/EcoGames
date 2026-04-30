import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DIFFICULTIES,
  getLayoutForDifficulty,
  getPairsForDifficulty,
  type Difficulty,
} from '../data';
import {
  canFlip,
  flipCard,
  rating,
  resolveTurn,
  revealAll,
  startGame,
  type GameState,
} from '../engine';
import LeaderboardPanel from '../../../components/LeaderboardPanel';
import Board from './Board';
import HUD from './HUD';
import MatchBurst from './MatchBurst';
import Confetti from './Confetti';
import { audio } from '../audio';
import { ACCENT, EMOJI_FONT, PAPER, PAPER_GRAIN } from '../theme';

type Screen = 'playing' | 'gameover' | 'leaderboard';

interface Burst {
  id: number;
  x: number;
  y: number;
  points: number;
  color: string;
}

interface SoloPlayProps {
  difficulty: Difficulty;
  studyMode: boolean;
  onExit: () => void;
}

const BEST_KEY = (d: Difficulty) => `eco-memory:best:${d}`;
const REVEAL_MATCH_MS = 650;
const REVEAL_MISS_MS = 950;
const GAMEOVER_DELAY_MS = 1700;
const STUDY_MS = 3500;

interface PaperButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  variant?: 'solid' | 'outline' | 'ghost';
}

/**
 * Tight inline button matching the warm-paper register. Used for the in-game
 * action row (mute / new / change mode) — the gradient EcoButton would clash
 * with the editorial surface so we hand-roll a smaller, quieter chip.
 */
function PaperButton({ children, onClick, ariaLabel, ariaPressed, variant = 'outline' }: PaperButtonProps) {
  const styles =
    variant === 'solid'
      ? { background: ACCENT, color: '#FFFFFF', border: `1px solid ${ACCENT}` }
      : variant === 'ghost'
        ? { background: 'transparent', color: PAPER.subInk, border: '1px solid transparent' }
        : { background: PAPER.surface, color: PAPER.ink, border: `1px solid ${PAPER.hairline}` };
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      sx={{
        cursor: 'pointer',
        borderRadius: 999,
        px: 'clamp(10px, 1.8cqmin, 14px)',
        py: 'clamp(5px, 1cqh, 8px)',
        fontFamily: 'inherit',
        fontSize: 'clamp(0.7rem, 1.6cqh, 0.82rem)',
        fontWeight: 700,
        letterSpacing: '0.02em',
        minHeight: 32,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'clamp(4px, 0.8cqmin, 6px)',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        '&:hover': {
          background: variant === 'solid' ? ACCENT : '#FFFFFF',
          borderColor: variant === 'ghost' ? PAPER.hairline : ACCENT,
        },
        '&:focus-visible': {
          outline: `2px solid ${ACCENT}`,
          outlineOffset: 2,
        },
        ...styles,
      }}
    >
      {children}
    </Box>
  );
}

export default function SoloPlay({ difficulty, studyMode, onExit }: SoloPlayProps) {
  const pairs = getPairsForDifficulty(difficulty);
  const { cols: BOARD_COLS, rows: BOARD_ROWS } = getLayoutForDifficulty(difficulty);
  const difficultyDef = DIFFICULTIES[difficulty];

  const [screen, setScreen] = useState<Screen>('playing');
  const [game, setGame] = useState<GameState>(() => {
    const fresh = startGame(pairs);
    return studyMode ? revealAll(fresh, true) : fresh;
  });
  const [scoreDelta, setScoreDelta] = useState<number | undefined>(undefined);
  const [best, setBest] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [muted, setMuted] = useState(() => audio.isMuted());
  const [studying, setStudying] = useState(studyMode);

  const totalPairs = pairs.length;
  const burstIdRef = useRef(0);
  // Derived: input is locked while two cards are mid-reveal or study
  // mode is still showing the deck.
  const locked = studying || game.flippedIds.length === 2;

  useEffect(() => {
    const raw = localStorage.getItem(BEST_KEY(difficulty));
    setBest(raw ? Number(raw) || 0 : 0);
  }, [difficulty]);

  useEffect(() => {
    if (game.score > best) {
      setBest(game.score);
      localStorage.setItem(BEST_KEY(difficulty), String(game.score));
    }
  }, [game.score, best, difficulty]);

  // Study mode: hold the reveal for STUDY_MS, then flip everything back and
  // unlock input. The fresh state already starts with revealAll(true) when
  // studyMode is on (see useState initialiser).
  useEffect(() => {
    if (!studying) return;
    const timer = window.setTimeout(() => {
      setGame(prev => revealAll(prev, false));
      setStudying(false);
    }, STUDY_MS);
    return () => window.clearTimeout(timer);
  }, [studying]);

  useEffect(() => {
    if (game.flippedIds.length !== 2) return;
    const [aId, bId] = game.flippedIds;
    const a = game.deck.find(c => c.id === aId)!;
    const b = game.deck.find(c => c.id === bId)!;
    const wait = a.pairId === b.pairId ? REVEAL_MATCH_MS : REVEAL_MISS_MS;
    const timer = window.setTimeout(() => {
      setGame(prev => {
        const result = resolveTurn(prev, totalPairs);
        if (result.delta !== 0) setScoreDelta(result.delta);
        if (result.matched && result.completedPair) {
          const aIdx = prev.deck.findIndex(c => c.id === aId);
          const bIdx = prev.deck.findIndex(c => c.id === bId);
          const cellCenter = (idx: number) => ({
            x: ((idx % BOARD_COLS) + 0.5) / BOARD_COLS * 100,
            y: (Math.floor(idx / BOARD_COLS) + 0.5) / BOARD_ROWS * 100,
          });
          const ca = cellCenter(aIdx);
          const cb = cellCenter(bIdx);
          setBursts(arr => [
            ...arr,
            {
              id: burstIdRef.current++,
              x: (ca.x + cb.x) / 2,
              y: (ca.y + cb.y) / 2,
              points: result.delta,
              color: result.completedPair!.color,
            },
          ]);
          audio.match();
        } else if (!result.matched) {
          audio.miss();
        }
        if (result.finished) {
          setShowConfetti(true);
          audio.win();
          window.setTimeout(() => setScreen('gameover'), GAMEOVER_DELAY_MS);
        }
        return result.state;
      });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [game.flippedIds, game.deck, totalPairs, BOARD_COLS, BOARD_ROWS]);

  const startNewGame = useCallback(() => {
    const fresh = startGame(pairs);
    setGame(studyMode ? revealAll(fresh, true) : fresh);
    setStudying(studyMode);
    setScoreDelta(undefined);
    setSubmitted(false);
    setBursts([]);
    setShowConfetti(false);
    setScreen('playing');
  }, [pairs, studyMode]);

  const onFlip = useCallback(
    (id: number) => {
      if (locked) return;
      setGame(prev => {
        if (!canFlip(prev, id)) return prev;
        audio.flip();
        return flipCard(prev, id);
      });
    },
    [locked],
  );

  const toggleMute = useCallback(() => {
    setMuted(audio.toggleMuted());
  }, []);

  const submitScore = useCallback(async () => {
    if (!playerName.trim() || submitted) return;
    const { submitScore: send } = await import('../../../lib/supabase');
    await send({ game_id: 'eco-memory', player_name: playerName.trim(), score: game.score });
    setSubmitted(true);
    setScreen('leaderboard');
  }, [playerName, submitted, game.score]);

  if (screen === 'leaderboard') {
    return (
      <PaperShell>
        <Typography
          component="h1"
          sx={{
            m: 0,
            color: PAPER.ink,
            fontSize: 'clamp(1.4rem, 4cqh, 2.2rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            mb: 'clamp(8px, 1.6cqh, 14px)',
            textAlign: 'center',
          }}
        >
          Eco Memory <Box component="span" sx={{ color: ACCENT }}>Leaderboard</Box>
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 540, mx: 'auto' }}>
          <LeaderboardPanel gameId="eco-memory" playerName={playerName} />
        </Box>
        <Box sx={{ mt: 'clamp(10px, 2cqh, 18px)', display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          <PaperButton variant="solid" onClick={startNewGame}>Play again</PaperButton>
          <PaperButton onClick={onExit}>Menu</PaperButton>
        </Box>
      </PaperShell>
    );
  }

  if (screen === 'gameover') {
    return (
      <PaperShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Typography
            component="span"
            sx={{
              display: 'block',
              color: ACCENT,
              fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            All matched
          </Typography>
          <Typography
            component="h1"
            sx={{
              m: 0,
              color: PAPER.ink,
              fontSize: 'clamp(1.5rem, 4.4cqh, 2.6rem)',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              textAlign: 'center',
              lineHeight: 1.05,
            }}
          >
            {rating(game.moves, totalPairs)}
          </Typography>
          <Typography
            sx={{
              mt: 'clamp(4px, 1cqh, 8px)',
              color: PAPER.subInk,
              fontSize: 'clamp(0.78rem, 1.7cqh, 0.95rem)',
              textAlign: 'center',
            }}
          >
            Score{' '}
            <Box component="span" sx={{ fontWeight: 800, color: PAPER.ink }}>
              {game.score.toLocaleString()}
            </Box>
            <Box component="span" sx={{ color: PAPER.faded, mx: 1 }}>·</Box>
            Moves{' '}
            <Box component="span" sx={{ fontWeight: 800, color: PAPER.ink }}>
              {game.moves}
            </Box>
            <Box component="span" sx={{ color: PAPER.faded, mx: 1 }}>·</Box>
            Best streak{' '}
            <Box component="span" sx={{ fontWeight: 800, color: PAPER.ink }}>
              ×{game.streak}
            </Box>
          </Typography>
          {game.score === best && best > 0 && (
            <Typography
              sx={{
                color: '#15803D',
                fontWeight: 800,
                mt: 0.5,
                textAlign: 'center',
                fontSize: 'clamp(0.78rem, 1.7cqh, 0.95rem)',
              }}
            >
              ★ New personal best
            </Typography>
          )}
        </motion.div>

        {game.unlocked.length > 0 && (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              mt: 'clamp(8px, 1.6cqh, 14px)',
              maxWidth: 720,
              width: '100%',
              mx: 'auto',
              overflowY: 'auto',
              borderTop: `1px solid ${PAPER.hairline}`,
              borderBottom: `1px solid ${PAPER.hairline}`,
              py: 'clamp(6px, 1.2cqh, 10px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(4px, 0.8cqh, 6px)',
            }}
          >
            {game.unlocked.map((u, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(8px, 1.6cqmin, 12px)',
                  px: 'clamp(8px, 1.6cqmin, 12px)',
                  py: 'clamp(4px, 0.8cqh, 7px)',
                  borderRadius: 'clamp(6px, 1.2cqmin, 10px)',
                  background: `${u.color}0D`,
                  border: `1px solid ${u.color}25`,
                  fontSize: 'clamp(0.72rem, 1.6cqh, 0.84rem)',
                  color: PAPER.ink,
                  lineHeight: 1.35,
                }}
              >
                <Box component="span" sx={{ fontFamily: EMOJI_FONT, flexShrink: 0 }}>
                  {u.emoji}
                </Box>
                <Box component="span" sx={{ minWidth: 0 }}>
                  <Box component="span" sx={{ fontWeight: 800, color: u.color }}>
                    {u.label}
                  </Box>
                  <Box component="span" sx={{ color: PAPER.faded, mx: 0.7 }}>—</Box>
                  {u.fact}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Box
          sx={{
            mt: 'clamp(8px, 1.6cqh, 14px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2cqh, 10px)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Box
              component="input"
              value={playerName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              sx={{
                px: 'clamp(10px, 2cqmin, 14px)',
                py: 'clamp(6px, 1.2cqh, 9px)',
                borderRadius: 999,
                border: `1px solid ${PAPER.hairline}`,
                background: PAPER.surface,
                color: PAPER.ink,
                fontFamily: 'inherit',
                fontSize: 'clamp(0.78rem, 1.7cqh, 0.92rem)',
                fontWeight: 600,
                outline: 'none',
                width: 'clamp(160px, 28cqw, 220px)',
                '&::placeholder': { color: PAPER.faded },
                '&:focus-visible': {
                  borderColor: ACCENT,
                  outline: `2px solid ${ACCENT}55`,
                  outlineOffset: 0,
                },
              }}
            />
            <PaperButton variant="solid" onClick={submitScore}>Submit ★</PaperButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.2, justifyContent: 'center' }}>
            <PaperButton onClick={startNewGame}>↻ Play again</PaperButton>
            <PaperButton variant="ghost" onClick={onExit}>↩ Menu</PaperButton>
          </Box>
        </Box>
      </PaperShell>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        background: PAPER.bg,
        backgroundImage: PAPER_GRAIN,
        backgroundRepeat: 'repeat',
        backgroundSize: '220px 220px',
        color: PAPER.ink,
        display: 'flex',
        flexDirection: 'column',
        // EcoMemoryGame hides the global BackToHome/MgtcLogo header during
        // play, so the action row sits flush at the top.
        pt: 'clamp(10px, 2cqh, 18px)',
        pb: 'clamp(10px, 2cqh, 18px)',
        px: 'clamp(16px, 3.5cqw, 44px)',
        gap: 'clamp(8px, 1.6cqh, 14px)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Action row — mute + restart + menu, right-aligned. The Menu button is
          the only path back to ModeSelect now that the global header is hidden
          mid-game. */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'clamp(6px, 1.2cqmin, 10px)',
          flexShrink: 0,
        }}
      >
        <PaperButton
          onClick={toggleMute}
          ariaLabel={muted ? 'Unmute sound' : 'Mute sound'}
          ariaPressed={muted}
        >
          <Box component="span" aria-hidden sx={{ fontFamily: EMOJI_FONT }}>{muted ? '🔇' : '🔊'}</Box>
        </PaperButton>
        <PaperButton onClick={startNewGame} ariaLabel="Start a new game">
          <Box component="span" aria-hidden>↻</Box> New game
        </PaperButton>
        <PaperButton variant="ghost" onClick={onExit} ariaLabel="Back to Eco Memory main menu">
          <Box component="span" aria-hidden>↩</Box> Menu
        </PaperButton>
      </Box>

      <HUD
        difficultyLabel={`${difficultyDef.label}`}
        modeLabel="Solo"
        score={game.score}
        best={best}
        moves={game.moves}
        matches={game.matches}
        totalPairs={totalPairs}
        streak={game.streak}
        scoreDelta={scoreDelta}
      />

      {/* Main play area — board on the left, persistent fact stack on the
          right. Putting facts in the empty corridor next to the board means
          they don't cover any cards and the player can re-read them later. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(10px, 2cqmin, 18px)',
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'grid', placeItems: 'center' }}>
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Board
              deck={game.deck}
              cards={game.cards}
              onFlip={onFlip}
              disabled={locked}
              cols={BOARD_COLS}
            />
            {bursts.map(b => (
              <MatchBurst
                key={b.id}
                x={b.x}
                y={b.y}
                points={b.points}
                color={b.color}
                onDone={() => setBursts(prev => prev.filter(p => p.id !== b.id))}
              />
            ))}
            {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
            <AnimatePresence>
              {studying && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 35,
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 0.7,
                      borderRadius: 999,
                      background: ACCENT,
                      color: '#FFFFFF',
                      fontSize: 'clamp(0.7rem, 1.6cqh, 0.82rem)',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      boxShadow: `0 6px 18px ${ACCENT}55`,
                    }}
                  >
                    Memorise the board…
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>

        <FactStack unlocked={game.unlocked} />
      </Box>
    </Box>
  );
}

interface FactStackProps {
  unlocked: GameState['unlocked'];
}

/**
 * Stacked fact panel that lives next to the board. Each completed pair adds a
 * card to the top of the stack and stays there for the rest of the round, so a
 * player who wants to re-read an earlier fact can scroll back to it instead of
 * losing the ribbon to a timeout.
 */
function FactStack({ unlocked }: FactStackProps) {
  const items = unlocked.slice().reverse();
  return (
    <Box
      sx={{
        flexShrink: 0,
        width: 'clamp(180px, 22cqw, 280px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 1,
          mb: 'clamp(4px, 0.8cqh, 7px)',
          flexShrink: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            color: ACCENT,
            fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Facts unlocked
        </Typography>
        <Typography
          component="span"
          sx={{
            color: PAPER.meta,
            fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {unlocked.length}
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(5px, 1cqh, 8px)',
          pr: 'clamp(2px, 0.6cqmin, 6px)',
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              border: `1px dashed ${PAPER.hairline}`,
              borderRadius: 'clamp(8px, 1.6cqmin, 12px)',
              p: 'clamp(8px, 1.6cqmin, 12px)',
              color: PAPER.faded,
              fontSize: 'clamp(0.7rem, 1.5cqh, 0.78rem)',
              fontStyle: 'italic',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            Match a pair to unlock its fact here.
          </Box>
        ) : (
          <AnimatePresence initial={false}>
            {items.map(u => (
              <motion.div
                key={u.pairId}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <Box
                  sx={{
                    px: 'clamp(8px, 1.6cqmin, 12px)',
                    py: 'clamp(6px, 1.2cqh, 10px)',
                    borderRadius: 'clamp(8px, 1.6cqmin, 12px)',
                    background: PAPER.surface,
                    border: `1px solid ${u.color}33`,
                    borderLeft: `3px solid ${u.color}`,
                    boxShadow: '0 1px 2px rgba(31,27,20,0.04)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(5px, 1cqmin, 8px)',
                      mb: 'clamp(2px, 0.5cqh, 4px)',
                    }}
                  >
                    <Box component="span" aria-hidden sx={{ fontFamily: EMOJI_FONT, fontSize: 'clamp(0.85rem, 1.9cqh, 1.05rem)', lineHeight: 1 }}>
                      {u.emoji}
                    </Box>
                    <Typography
                      component="span"
                      sx={{
                        color: u.color,
                        fontSize: 'clamp(0.72rem, 1.6cqh, 0.84rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.005em',
                        lineHeight: 1.15,
                      }}
                    >
                      {u.label}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: PAPER.ink,
                      fontSize: 'clamp(0.66rem, 1.45cqh, 0.76rem)',
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {u.fact}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
}

/**
 * Shared paper-grain shell for the leaderboard and game-over screens. Centered
 * column, full-stage height, no scroll on the outer container — children
 * clamp themselves so the page always fits the 16:9 stage.
 */
function PaperShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        background: PAPER.bg,
        backgroundImage: PAPER_GRAIN,
        backgroundRepeat: 'repeat',
        backgroundSize: '220px 220px',
        color: PAPER.ink,
        display: 'flex',
        flexDirection: 'column',
        pt: 'clamp(14px, 2.8cqh, 26px)',
        pb: 'clamp(12px, 2.4cqh, 22px)',
        px: 'clamp(16px, 3.5cqw, 44px)',
        gap: 'clamp(8px, 1.6cqh, 14px)',
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
}

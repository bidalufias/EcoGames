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
  resolveTurn,
  revealAll,
  startGame,
  type GameState,
} from '../engine';
import Board from './Board';
import MatchBurst from './MatchBurst';
import Confetti from './Confetti';
import PlayerHUD from './PlayerHUD';
import { audio } from '../audio';
import { ACCENT, EMOJI_FONT, PAPER, PAPER_GRAIN } from '../theme';

interface VersusPlayProps {
  difficulty: Difficulty;
  studyMode: boolean;
  onExit: () => void;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  points: number;
  color: string;
}

interface PlayerStats {
  matches: number;
  score: number;
}

const REVEAL_MATCH_MS = 700;
const REVEAL_MISS_MS = 1000;
const GAMEOVER_DELAY_MS = 1700;
const STUDY_MS = 3500;

const PLAYERS = [
  { id: 0 as const, label: 'Player 1', emoji: '🟢', accent: '#15803D' },
  { id: 1 as const, label: 'Player 2', emoji: '🔵', accent: '#1D4ED8' },
];

interface PaperButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  variant?: 'solid' | 'outline' | 'ghost';
}

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

interface ActionRowProps {
  muted: boolean;
  onToggleMute: () => void;
  onNewGame: () => void;
  onExit: () => void;
  difficultyLabel: string;
  pairsLeft: number;
  totalPairs: number;
}

/**
 * Mirrored action row used at both ends of the versus screen — meta on the
 * left, mute / new / change-mode on the right. Mirroring (rather than a single
 * top strip) means whichever player just made a move can reach the controls
 * without standing up; per-end orientation is applied by the parent.
 */
function ActionRow({
  muted,
  onToggleMute,
  onNewGame,
  onExit,
  difficultyLabel,
  pairsLeft,
  totalPairs,
}: ActionRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(8px, 1.6cqmin, 14px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            color: ACCENT,
            fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Versus · {difficultyLabel}
        </Typography>
        <Typography
          component="span"
          sx={{
            color: PAPER.meta,
            fontSize: 'clamp(0.6rem, 1.4cqh, 0.72rem)',
            fontWeight: 600,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
          }}
        >
          · {pairsLeft} of {totalPairs} left
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 'clamp(6px, 1.2cqmin, 10px)' }}>
        <PaperButton
          onClick={onToggleMute}
          ariaLabel={muted ? 'Unmute sound' : 'Mute sound'}
          ariaPressed={muted}
        >
          <Box component="span" aria-hidden sx={{ fontFamily: EMOJI_FONT }}>
            {muted ? '🔇' : '🔊'}
          </Box>
        </PaperButton>
        <PaperButton onClick={onNewGame} ariaLabel="Start a new game">
          <Box component="span" aria-hidden>↻</Box> New
        </PaperButton>
        <PaperButton variant="ghost" onClick={onExit} ariaLabel="Back to Eco Memory main menu">
          <Box component="span" aria-hidden>↩</Box> Menu
        </PaperButton>
      </Box>
    </Box>
  );
}

interface FactStackProps {
  unlocked: GameState['unlocked'];
  flipped?: boolean;
}

/**
 * Per-player fact stack. Lives in a fixed-width column to the side of the
 * board so the cards are never obscured. The `flipped` variant rotates 180°
 * for the player on the far side of a tabletop iPad — pair it with the
 * opposite-side column so each player has a stack on their right hand. Newly
 * unlocked facts animate in at the top and previous facts stay scrollable, so
 * either player can re-read what they've already matched.
 */
function FactStack({ unlocked, flipped }: FactStackProps) {
  // Newest first so it lands at the top of the (rotated) column.
  const items = unlocked.slice().reverse();
  return (
    <Box
      sx={{
        flexShrink: 0,
        width: 'clamp(120px, 16cqw, 200px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        transform: flipped ? 'rotate(180deg)' : 'none',
        transformOrigin: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 1,
          mb: 'clamp(4px, 0.8cqh, 6px)',
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            color: ACCENT,
            fontSize: 'clamp(0.55rem, 1.3cqh, 0.66rem)',
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Facts
        </Typography>
        <Typography
          component="span"
          sx={{
            color: PAPER.meta,
            fontSize: 'clamp(0.55rem, 1.3cqh, 0.66rem)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
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
          gap: 'clamp(4px, 0.8cqh, 6px)',
          pr: 'clamp(2px, 0.5cqmin, 5px)',
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              border: `1px dashed ${PAPER.hairline}`,
              borderRadius: 'clamp(6px, 1.2cqmin, 10px)',
              p: 'clamp(6px, 1.2cqmin, 10px)',
              color: PAPER.faded,
              fontSize: 'clamp(0.6rem, 1.35cqh, 0.7rem)',
              fontStyle: 'italic',
              lineHeight: 1.35,
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
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              >
                <Box
                  sx={{
                    px: 'clamp(7px, 1.4cqmin, 10px)',
                    py: 'clamp(5px, 1cqh, 8px)',
                    borderRadius: 'clamp(7px, 1.4cqmin, 11px)',
                    background: PAPER.surface,
                    border: `1px solid ${u.color}33`,
                    borderLeft: `3px solid ${u.color}`,
                    boxShadow: '0 1px 2px rgba(31,27,20,0.04)',
                    lineHeight: 1.3,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(4px, 0.8cqmin, 6px)',
                      mb: 'clamp(2px, 0.4cqh, 3px)',
                    }}
                  >
                    <Box component="span" aria-hidden sx={{ fontFamily: EMOJI_FONT, fontSize: 'clamp(0.78rem, 1.7cqh, 0.95rem)', lineHeight: 1 }}>
                      {u.emoji}
                    </Box>
                    <Typography
                      component="span"
                      sx={{
                        color: u.color,
                        fontSize: 'clamp(0.65rem, 1.45cqh, 0.78rem)',
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
                      fontSize: 'clamp(0.6rem, 1.35cqh, 0.72rem)',
                      fontWeight: 500,
                      lineHeight: 1.35,
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

export default function VersusPlay({ difficulty, studyMode, onExit }: VersusPlayProps) {
  const pairs = getPairsForDifficulty(difficulty);
  const { cols: BOARD_COLS, rows: BOARD_ROWS } = getLayoutForDifficulty(difficulty);
  const difficultyDef = DIFFICULTIES[difficulty];

  const [game, setGame] = useState<GameState>(() => {
    const fresh = startGame(pairs);
    return studyMode ? revealAll(fresh, true) : fresh;
  });
  const [current, setCurrent] = useState<0 | 1>(0);
  const [stats, setStats] = useState<[PlayerStats, PlayerStats]>([
    { matches: 0, score: 0 },
    { matches: 0, score: 0 },
  ]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(() => audio.isMuted());
  const [studying, setStudying] = useState(studyMode);

  const totalPairs = pairs.length;
  const burstIdRef = useRef(0);
  // Derived: input is locked during the study reveal or while a flipped pair
  // is being resolved.
  const locked = studying || game.flippedIds.length === 2;

  // Study mode: hold the reveal then flip the deck back face-down.
  useEffect(() => {
    if (!studying) return;
    const timer = window.setTimeout(() => {
      setGame(prev => revealAll(prev, false));
      setStudying(false);
    }, STUDY_MS);
    return () => window.clearTimeout(timer);
  }, [studying]);

  // Resolve a flipped pair, attribute score to the current player, and pass
  // the turn on a miss. Same shape as SoloPlay, but with per-player accounting.
  useEffect(() => {
    if (game.flippedIds.length !== 2) return;
    const [aId, bId] = game.flippedIds;
    const a = game.deck.find(c => c.id === aId)!;
    const b = game.deck.find(c => c.id === bId)!;
    const wait = a.pairId === b.pairId ? REVEAL_MATCH_MS : REVEAL_MISS_MS;
    const timer = window.setTimeout(() => {
      setGame(prev => {
        const result = resolveTurn(prev, totalPairs);
        if (result.matched && result.completedPair) {
          setStats(s => {
            const next: [PlayerStats, PlayerStats] = [s[0], s[1]];
            next[current] = {
              matches: next[current].matches + 1,
              score: next[current].score + result.delta,
            };
            return next;
          });
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
              color: PLAYERS[current].accent,
            },
          ]);
          audio.match();
        } else if (!result.matched) {
          setCurrent(c => (c === 0 ? 1 : 0));
          audio.miss();
        }
        if (result.finished) {
          setShowConfetti(true);
          audio.win();
          window.setTimeout(() => setFinished(true), GAMEOVER_DELAY_MS);
        }
        return result.state;
      });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [game.flippedIds, game.deck, totalPairs, current, BOARD_COLS, BOARD_ROWS]);

  const startNewGame = useCallback(() => {
    const fresh = startGame(pairs);
    setGame(studyMode ? revealAll(fresh, true) : fresh);
    setStudying(studyMode);
    setCurrent(0);
    setStats([
      { matches: 0, score: 0 },
      { matches: 0, score: 0 },
    ]);
    setBursts([]);
    setShowConfetti(false);
    setFinished(false);
  }, [pairs, studyMode]);

  const onFlip = useCallback(
    (id: number) => {
      if (locked || finished) return;
      setGame(prev => {
        if (!canFlip(prev, id)) return prev;
        audio.flip();
        return flipCard(prev, id);
      });
    },
    [locked, finished],
  );

  const toggleMute = useCallback(() => {
    setMuted(audio.toggleMuted());
  }, []);

  const winner =
    stats[0].matches === stats[1].matches
      ? null
      : stats[0].matches > stats[1].matches
        ? 0
        : 1;

  if (finished) {
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
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
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
            Game over
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
            {winner === null ? "It's a tie" : `${PLAYERS[winner].label} wins`}
          </Typography>
          {winner !== null && (
            <Typography
              sx={{
                color: PLAYERS[winner].accent,
                mt: 0.5,
                textAlign: 'center',
                fontSize: 'clamp(0.85rem, 2cqh, 1.1rem)',
                fontWeight: 700,
                fontFamily: EMOJI_FONT,
              }}
            >
              {PLAYERS[winner].emoji} {stats[winner].matches} pairs · {stats[winner].score.toLocaleString()} pts
            </Typography>
          )}
        </motion.div>

        <Box
          sx={{
            display: 'flex',
            gap: 'clamp(10px, 2cqmin, 18px)',
            mx: 'auto',
            maxWidth: 720,
            width: '100%',
            flexShrink: 0,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {PLAYERS.map(p => (
            <Box
              key={p.id}
              sx={{
                flex: 1,
                minWidth: 'clamp(160px, 28cqw, 240px)',
                p: 'clamp(10px, 2cqh, 16px)',
                borderRadius: 'clamp(10px, 2cqmin, 14px)',
                background: PAPER.surface,
                border: `1.5px solid ${winner === p.id ? p.accent : PAPER.hairline}`,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: 'clamp(1.1rem, 2.6cqh, 1.4rem)', fontFamily: EMOJI_FONT }}>{p.emoji}</Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: p.accent,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontSize: 'clamp(0.62rem, 1.4cqh, 0.72rem)',
                  mt: 0.5,
                }}
              >
                {p.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 'clamp(1.1rem, 2.8cqh, 1.5rem)',
                  fontWeight: 900,
                  mt: 'clamp(2px, 0.5cqh, 4px)',
                  color: PAPER.ink,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {stats[p.id].matches}
              </Typography>
              <Typography sx={{ fontSize: 'clamp(0.7rem, 1.5cqh, 0.78rem)', color: PAPER.meta, fontWeight: 600 }}>
                pairs · {stats[p.id].score.toLocaleString()} pts
              </Typography>
            </Box>
          ))}
        </Box>

        {game.unlocked.length > 0 && (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
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

        <Box sx={{ display: 'flex', gap: 1.2, justifyContent: 'center', flexShrink: 0 }}>
          <PaperButton variant="solid" onClick={startNewGame}>↻ Rematch</PaperButton>
          <PaperButton onClick={onExit}>↩ Menu</PaperButton>
        </Box>
      </Box>
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
        // play, so the top action row sits flush at the top.
        pt: 'clamp(8px, 1.6cqh, 14px)',
        pb: 'clamp(8px, 1.6cqh, 14px)',
        px: 'clamp(16px, 3.5cqw, 44px)',
        gap: 'clamp(6px, 1.2cqh, 10px)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Player 2's region — actions + HUD, all rotated 180° so the player
          on the far side of a tabletop iPad reads them upright. */}
      <Box sx={{ flexShrink: 0, transform: 'rotate(180deg)' }}>
        <ActionRow
          muted={muted}
          onToggleMute={toggleMute}
          onNewGame={startNewGame}
          onExit={onExit}
          difficultyLabel={difficultyDef.label}
          pairsLeft={totalPairs - game.matches}
          totalPairs={totalPairs}
        />
      </Box>
      <Box sx={{ flexShrink: 0 }}>
        <PlayerHUD
          label={PLAYERS[1].label}
          emoji={PLAYERS[1].emoji}
          accent={PLAYERS[1].accent}
          matches={stats[1].matches}
          score={stats[1].score}
          isActive={current === 1 && !finished}
          flipped
        />
      </Box>

      {/* Main play row — board centred between two mirrored fact stacks so
          each player has a column on their right hand (left of screen for
          P2, right of screen for P1). The cards are never covered and both
          players can re-read previously unlocked facts at any time. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(8px, 1.6cqmin, 14px)',
          alignItems: 'stretch',
        }}
      >
        <FactStack unlocked={game.unlocked} flipped />

        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'grid', placeItems: 'center', position: 'relative' }}>
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

      <Box sx={{ flexShrink: 0 }}>
        <PlayerHUD
          label={PLAYERS[0].label}
          emoji={PLAYERS[0].emoji}
          accent={PLAYERS[0].accent}
          matches={stats[0].matches}
          score={stats[0].score}
          isActive={current === 0 && !finished}
        />
      </Box>
      {/* Player 1's region — same controls in normal orientation. */}
      <Box sx={{ flexShrink: 0 }}>
        <ActionRow
          muted={muted}
          onToggleMute={toggleMute}
          onNewGame={startNewGame}
          onExit={onExit}
          difficultyLabel={difficultyDef.label}
          pairsLeft={totalPairs - game.matches}
          totalPairs={totalPairs}
        />
      </Box>
    </Box>
  );
}

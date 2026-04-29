import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
import EcoButton from '../../../components/EcoButton';
import Board from './Board';
import MatchBurst from './MatchBurst';
import Confetti from './Confetti';
import PlayerHUD from './PlayerHUD';
import { audio } from '../audio';

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
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const PLAYERS = [
  { id: 0 as const, label: 'Player 1', emoji: '🟢', accent: '#0D9B4A' },
  { id: 1 as const, label: 'Player 2', emoji: '🔵', accent: '#0EA5E9' },
];

export default function VersusPlay({ difficulty, studyMode, onExit }: VersusPlayProps) {
  const pairs = getPairsForDifficulty(difficulty);
  const { cols: BOARD_COLS, rows: BOARD_ROWS } = getLayoutForDifficulty(difficulty);

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
  const [fact, setFact] = useState<string | null>(null);
  const [studying, setStudying] = useState(studyMode);

  const totalPairs = pairs.length;
  const factTimer = useRef<number | null>(null);
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
          setFact(result.completedPair.fact);
          if (factTimer.current) window.clearTimeout(factTimer.current);
          factTimer.current = window.setTimeout(() => setFact(null), 3000);
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

  useEffect(
    () => () => {
      if (factTimer.current) window.clearTimeout(factTimer.current);
    },
    [],
  );

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
    setFact(null);
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
          height: '100dvh',
          bgcolor: '#FAFBFC',
          color: '#1A2332',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 4,
          overflow: 'hidden',
        }}
      >
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }} align="center">
            {winner === null ? "It's a tie! 🤝" : `${PLAYERS[winner].label} wins! 🎉`}
          </Typography>
          {winner !== null && (
            <Typography
              variant="h5"
              sx={{ color: PLAYERS[winner].accent, mb: 3, fontFamily: EMOJI_FONT }}
              align="center"
            >
              {PLAYERS[winner].emoji} {stats[winner].matches} pairs · {stats[winner].score.toLocaleString()} pts
            </Typography>
          )}
        </motion.div>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 560,
            width: '100%',
          }}
        >
          {PLAYERS.map(p => (
            <Box
              key={p.id}
              sx={{
                flex: 1,
                minWidth: 200,
                p: 2,
                borderRadius: 3,
                background: '#FFFFFF',
                border: `2px solid ${p.accent}33`,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '1.4rem', fontFamily: EMOJI_FONT }}>{p.emoji}</Typography>
              <Typography sx={{ fontWeight: 800, color: p.accent, mt: 0.5 }}>{p.label}</Typography>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, mt: 0.5, color: '#1A2332' }}>
                {stats[p.id].matches}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#5A6A7E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                pairs · {stats[p.id].score.toLocaleString()} pts
              </Typography>
            </Box>
          ))}
        </Box>

        {game.unlocked.length > 0 && (
          <Box
            sx={{
              mb: 3,
              maxWidth: 560,
              width: '100%',
              maxHeight: '24vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.6,
            }}
          >
            {game.unlocked.map((u, i) => (
              <Box
                key={i}
                sx={{
                  px: 1.5,
                  py: 0.7,
                  borderRadius: 2,
                  background: `${u.color}10`,
                  border: `1px solid ${u.color}25`,
                  fontSize: 13,
                }}
              >
                <Box component="span" sx={{ fontFamily: EMOJI_FONT, mr: 0.5 }}>
                  {u.emoji}
                </Box>
                <Box component="span" sx={{ fontWeight: 700, color: u.color, mr: 0.5 }}>
                  {u.label}
                </Box>
                — {u.fact}
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          <EcoButton onClick={startNewGame}>Rematch</EcoButton>
          <EcoButton onClick={onExit} variant="secondary">
            Change mode
          </EcoButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100dvh',
        bgcolor: '#F0F3F7',
        color: '#1A2332',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 'clamp(8px, 2vw, 24px)',
        py: 'clamp(8px, 2vh, 16px)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 620,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Player 2 panel — rotated 180° so it reads right-side up from the
            far side of a tabletop iPad. */}
        <PlayerHUD
          label={PLAYERS[1].label}
          emoji={PLAYERS[1].emoji}
          accent={PLAYERS[1].accent}
          matches={stats[1].matches}
          score={stats[1].score}
          isActive={current === 1 && !finished}
          flipped
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 1,
                py: 0.3,
                borderRadius: 999,
                background: '#9B59B61F',
                color: '#9B59B6',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: EMOJI_FONT,
              }}
            >
              {difficulty === 'easy' ? '🌱 Easy' : difficulty === 'hard' ? '🌳 Hard' : '🌿 Medium'}
            </Box>
            <Typography sx={{ fontSize: 12, color: '#5A6A7E', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
              Pairs left:
            </Typography>
            <Typography sx={{ fontWeight: 800, color: '#1A2332' }}>
              {totalPairs - game.matches}/{totalPairs}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              component="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
              sx={{
                background: '#FFFFFF',
                border: '1px solid #E1E6ED',
                borderRadius: 2,
                px: 1.2,
                py: 0.4,
                cursor: 'pointer',
                fontSize: '1rem',
                color: muted ? '#A0AABB' : '#1A2332',
              }}
            >
              {muted ? '🔇' : '🔊'}
            </Box>
            <EcoButton size="small" onClick={startNewGame}>
              New Game
            </EcoButton>
            <EcoButton size="small" variant="ghost" onClick={onExit}>
              Exit
            </EcoButton>
          </Box>
        </Box>

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
                      background: '#0D9B4A',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      boxShadow: '0 6px 18px rgba(13,155,74,0.35)',
                    }}
                  >
                    📖 Memorise the board…
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>

        <PlayerHUD
          label={PLAYERS[0].label}
          emoji={PLAYERS[0].emoji}
          accent={PLAYERS[0].accent}
          matches={stats[0].matches}
          score={stats[0].score}
          isActive={current === 0 && !finished}
        />
      </Box>

      <AnimatePresence>
        {fact && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.2,
                borderRadius: 2,
                background: '#FFFFFFF2',
                border: `2px solid ${PLAYERS[current].accent}55`,
                maxWidth: 420,
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            >
              <Typography sx={{ fontSize: 13, color: PLAYERS[current].accent, fontWeight: 700 }}>
                💡 {fact}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

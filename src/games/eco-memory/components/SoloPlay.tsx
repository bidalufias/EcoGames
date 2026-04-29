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
  rating,
  resolveTurn,
  revealAll,
  startGame,
  type GameState,
} from '../engine';
import EcoButton from '../../../components/EcoButton';
import LeaderboardPanel from '../../../components/LeaderboardPanel';
import Board from './Board';
import HUD from './HUD';
import MatchBurst from './MatchBurst';
import Confetti from './Confetti';
import { audio } from '../audio';

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
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export default function SoloPlay({ difficulty, studyMode, onExit }: SoloPlayProps) {
  const pairs = getPairsForDifficulty(difficulty);
  const { cols: BOARD_COLS, rows: BOARD_ROWS } = getLayoutForDifficulty(difficulty);

  const [screen, setScreen] = useState<Screen>('playing');
  const [game, setGame] = useState<GameState>(() => {
    const fresh = startGame(pairs);
    return studyMode ? revealAll(fresh, true) : fresh;
  });
  const [scoreDelta, setScoreDelta] = useState<number | undefined>(undefined);
  const [fact, setFact] = useState<string | null>(null);
  const [best, setBest] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [muted, setMuted] = useState(() => audio.isMuted());
  const [studying, setStudying] = useState(studyMode);

  const totalPairs = pairs.length;
  const factTimer = useRef<number | null>(null);
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
    setScoreDelta(undefined);
    setFact(null);
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
      <Box
        sx={{
          minHeight: '100%',
          bgcolor: '#FAFBFC',
          color: '#1A2332',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
          🏆 Eco Memory Leaderboard
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 500 }}>
          <LeaderboardPanel gameId="eco-memory" playerName={playerName} />
        </Box>
        <Box sx={{ mt: 4, display: 'flex', gap: 1.5 }}>
          <EcoButton onClick={startNewGame}>Play Again</EcoButton>
          <EcoButton variant="secondary" onClick={onExit}>
            Change mode
          </EcoButton>
        </Box>
      </Box>
    );
  }

  if (screen === 'gameover') {
    return (
      <Box
        sx={{
          height: '100%',
          bgcolor: '#FAFBFC',
          color: '#1A2332',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          overflow: 'hidden',
        }}
      >
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }} align="center">
            All Matched! 🎉
          </Typography>
          <Typography variant="h5" sx={{ color: '#9B59B6', mb: 1 }} align="center">
            {rating(game.moves, totalPairs)}
          </Typography>
          <Typography sx={{ color: '#5A6A7E', mb: 1 }} align="center">
            Score{' '}
            <Box component="span" sx={{ fontWeight: 800, color: '#1A2332' }}>
              {game.score.toLocaleString()}
            </Box>
            {' · '}
            Moves{' '}
            <Box component="span" sx={{ fontWeight: 800, color: '#1A2332' }}>
              {game.moves}
            </Box>
            {' · '}
            Best streak{' '}
            <Box component="span" sx={{ fontWeight: 800, color: '#1A2332' }}>
              ×{game.streak}
            </Box>
          </Typography>
          {game.score === best && best > 0 && (
            <Typography sx={{ color: '#0D9B4A', fontWeight: 700, mb: 2 }} align="center">
              🌟 New personal best!
            </Typography>
          )}
        </motion.div>

        {game.unlocked.length > 0 && (
          <Box
            sx={{
              mt: 1,
              mb: 3,
              maxWidth: 560,
              width: '100%',
              maxHeight: '32cqh',
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
                  py: 0.8,
                  borderRadius: 2,
                  background: `${u.color}10`,
                  border: `1px solid ${u.color}25`,
                  fontSize: 13,
                  color: '#1A2332',
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

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(13,155,74,0.3)',
                fontSize: '1rem',
                outline: 'none',
                width: 180,
              }}
            />
            <EcoButton onClick={submitScore}>🏆 Submit</EcoButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <EcoButton onClick={startNewGame}>Play Again</EcoButton>
            <EcoButton onClick={onExit} variant="secondary">
              Change mode
            </EcoButton>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: '#F0F3F7',
        color: '#1A2332',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 'clamp(8px, 2cqw, 24px)',
        py: 'clamp(8px, 2cqh, 20px)',
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
          gap: 1.2,
        }}
      >
        <HUD
          score={game.score}
          best={best}
          moves={game.moves}
          matches={game.matches}
          totalPairs={totalPairs}
          streak={game.streak}
          scoreDelta={scoreDelta}
          muted={muted}
          onToggleMute={toggleMute}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1,
              py: 0.3,
              borderRadius: 999,
              background: '#9B59B61F',
              color: '#9B59B6',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: EMOJI_FONT,
            }}
          >
            {difficulty === 'easy' ? '🌱 Easy' : difficulty === 'hard' ? '🌳 Hard' : '🌿 Medium'}
            <Box component="span" sx={{ opacity: 0.7, ml: 0.4, letterSpacing: 0 }}>
              {totalPairs} pairs
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <EcoButton size="small" onClick={startNewGame}>
              New Game
            </EcoButton>
            <EcoButton size="small" variant="ghost" onClick={onExit}>
              Change mode
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
      </Box>

      <AnimatePresence>
        {fact && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'absolute',
              bottom: 'max(20px, env(safe-area-inset-bottom))',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                background: '#9B59B612',
                border: '1px solid #9B59B635',
                maxWidth: 460,
                textAlign: 'center',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Typography sx={{ fontSize: 13, color: '#9B59B6', fontWeight: 600 }}>💡 {fact}</Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { GHG_PAIRS } from './data';
import {
  canFlip,
  flipCard,
  rating,
  resolveTurn,
  startGame,
  type GameState,
} from './engine';
import EcoButton from '../../components/EcoButton';
import LeaderboardPanel from '../../components/LeaderboardPanel';
import Board from './components/Board';
import HUD from './components/HUD';

type Screen = 'intro' | 'playing' | 'gameover' | 'leaderboard';

const BEST_KEY = 'eco-memory:best';
const REVEAL_MATCH_MS = 650;
const REVEAL_MISS_MS = 950;

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export default function EcoMemoryGame() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [game, setGame] = useState<GameState>(() => startGame());
  const [scoreDelta, setScoreDelta] = useState<number | undefined>(undefined);
  const [fact, setFact] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [best, setBest] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totalPairs = GHG_PAIRS.length;
  const factTimer = useRef<number | null>(null);

  // Load persisted best score on mount.
  useEffect(() => {
    const raw = localStorage.getItem(BEST_KEY);
    setBest(raw ? Number(raw) || 0 : 0);
  }, []);

  // Persist when score beats best.
  useEffect(() => {
    if (game.score > best) {
      setBest(game.score);
      localStorage.setItem(BEST_KEY, String(game.score));
    }
  }, [game.score, best]);

  // Two cards flipped → resolve after a short reveal so the player can see
  // both faces. Replaces the old in-render `setTimeout`.
  useEffect(() => {
    if (game.flippedIds.length !== 2) return;
    setLocked(true);
    const [aId, bId] = game.flippedIds;
    const a = game.deck.find(c => c.id === aId)!;
    const b = game.deck.find(c => c.id === bId)!;
    const wait = a.pairId === b.pairId ? REVEAL_MATCH_MS : REVEAL_MISS_MS;
    const timer = window.setTimeout(() => {
      setGame(prev => {
        const result = resolveTurn(prev, totalPairs);
        if (result.delta !== 0) setScoreDelta(result.delta);
        if (result.completedPair) {
          setFact(result.completedPair.fact);
          if (factTimer.current) window.clearTimeout(factTimer.current);
          factTimer.current = window.setTimeout(() => setFact(null), 3000);
        }
        if (result.finished) {
          window.setTimeout(() => setScreen('gameover'), 600);
        }
        return result.state;
      });
      setLocked(false);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [game.flippedIds, game.deck, totalPairs]);

  useEffect(
    () => () => {
      if (factTimer.current) window.clearTimeout(factTimer.current);
    },
    [],
  );

  const startNewGame = useCallback(() => {
    setGame(startGame());
    setScoreDelta(undefined);
    setFact(null);
    setLocked(false);
    setSubmitted(false);
    setScreen('playing');
  }, []);

  const onFlip = useCallback(
    (id: number) => {
      if (locked) return;
      setGame(prev => (canFlip(prev, id) ? flipCard(prev, id) : prev));
    },
    [locked],
  );

  const submitScore = useCallback(async () => {
    if (!playerName.trim() || submitted) return;
    const { submitScore: send } = await import('../../lib/supabase');
    await send({ game_id: 'eco-memory', player_name: playerName.trim(), score: game.score });
    setSubmitted(true);
    setScreen('leaderboard');
  }, [playerName, submitted, game.score]);

  // ---------- Intro ----------
  if (screen === 'intro') {
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography
            variant="h3"
            sx={{
              background: 'linear-gradient(135deg, #9B59B6, #007DC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              mb: 1.5,
              fontFamily: `Inter, ${EMOJI_FONT}`,
            }}
            align="center"
          >
            🧠 Eco Memory
          </Typography>
          <Typography variant="h6" sx={{ color: '#5A6A7E', mb: 3 }} align="center">
            Match greenhouse gases to their sources.
          </Typography>
        </motion.div>
        <Box sx={{ maxWidth: 620, mb: 3 }}>
          <Typography sx={{ mb: 1.5, color: '#1A2332' }} align="center">
            Pairs you can match:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {GHG_PAIRS.map(p => (
              <Box
                key={p.label}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  background: `${p.color}10`,
                  border: `1px solid ${p.color}30`,
                  fontSize: 14,
                  fontFamily: EMOJI_FONT,
                }}
              >
                {p.emoji} {p.label} ↔ {p.sourceEmoji} {p.source}
              </Box>
            ))}
          </Box>
        </Box>
        <Typography sx={{ color: '#5A6A7E', mb: 3, maxWidth: 470, textAlign: 'center' }}>
          Flip two cards to find a match. Streaks score bigger — every match unlocks a climate fact.
        </Typography>
        <EcoButton onClick={startNewGame} size="large">
          Start Matching 🧠
        </EcoButton>
      </Box>
    );
  }

  // ---------- Leaderboard ----------
  if (screen === 'leaderboard') {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
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
          <EcoButton variant="secondary" onClick={() => setScreen('intro')}>
            Info
          </EcoButton>
        </Box>
      </Box>
    );
  }

  // ---------- Game over ----------
  if (screen === 'gameover') {
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
            Score <Box component="span" sx={{ fontWeight: 800, color: '#1A2332' }}>{game.score.toLocaleString()}</Box>
            {' · '}
            Moves <Box component="span" sx={{ fontWeight: 800, color: '#1A2332' }}>{game.moves}</Box>
            {' · '}
            Best streak <Box component="span" sx={{ fontWeight: 800, color: '#1A2332' }}>×{game.streak}</Box>
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
              maxHeight: '32vh',
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
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
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
            <EcoButton onClick={() => setScreen('intro')} variant="secondary">
              Info
            </EcoButton>
          </Box>
        </Box>
      </Box>
    );
  }

  // ---------- Playing ----------
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
        py: 'clamp(8px, 2vh, 20px)',
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
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexShrink: 0 }}>
          <EcoButton size="small" onClick={startNewGame}>
            New Game
          </EcoButton>
        </Box>

        {/* Board fills the leftover height; the inner grid self-caps to a
            square that fits both width and height. */}
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'grid', placeItems: 'center' }}>
          <Box sx={{ width: '100%', height: '100%' }}>
            <Board deck={game.deck} cards={game.cards} onFlip={onFlip} disabled={locked} />
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
              position: 'fixed',
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

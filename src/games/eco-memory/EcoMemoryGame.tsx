import { useState, useCallback } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { createCards, GHG_PAIRS } from './data';
import type { Card } from './data';
import EcoButton from '../../components/EcoButton';
import LeaderboardPanel from '../../components/LeaderboardPanel';

type Screen = 'intro' | 'playing' | 'gameover' | 'leaderboard';

export default function EcoMemoryGame() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [playerName, setPlayerName] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [fact, setFact] = useState('');
  const [locked, setLocked] = useState(false);

  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isSmall = useMediaQuery('(max-height: 500px)');

  const totalPairs = GHG_PAIRS.length;
  const totalCards = totalPairs * 2;
  const cols = isLandscape ? (totalCards <= 16 ? 4 : 5) : 4;
  const gap = 8;
  const availH = isSmall ? '70vh' : '78vh';

  const startGame = useCallback(() => {
    setCards(createCards());
    setFlipped([]); setMoves(0); setMatches(0); setFact(''); setLocked(false);
    setScreen('playing');
  }, []);

  const handleCardClick = useCallback((id: number) => {
    if (locked) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [first, second] = newFlipped.map(fid => cards.find(c => c.id === fid)!);

      if (first.pairId === second.pairId) {
        setMatches(m => m + 1);
        setFact(`💡 ${first.fact}`);
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === first.pairId ? { ...c, matched: true } : c));
          setFlipped([]); setLocked(false);
          setTimeout(() => setFact(''), 3000);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]); setLocked(false);
        }, 1000);
      }
    }
  }, [cards, flipped, locked]);

  if (screen === 'playing' && matches === totalPairs) {
    setTimeout(() => setScreen('gameover'), 500);
  }

  // --- Intro ---
  if (screen === 'intro') {
    return (
      <Box sx={{
        height: '100dvh', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        px: 3, py: 4, overflow: 'hidden',
      }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h3" sx={{
            background: 'linear-gradient(135deg, #9B59B6, #007DC4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, mb: 2,
          }} align="center">🧠 Eco Memory</Typography>
          <Typography variant="h6" sx={{ color: '#5A6A7E', mb: 4 }} align="center">
            Match greenhouse gases to their sources and effects!
          </Typography>
        </motion.div>
        <Box sx={{ maxWidth: 600, mb: 3 }}>
          <Typography sx={{ mb: 2, color: '#1A2332' }} align="center">Match each gas to its source:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {GHG_PAIRS.map(p => (
              <Box key={p.label} sx={{ px: 1.5, py: 0.5, borderRadius: 2, background: `${p.color}10`, border: `1px solid ${p.color}25`, fontSize: 14 }}>
                {p.emoji} {p.label} ↔ {p.source}
              </Box>
            ))}
          </Box>
        </Box>
        <Typography sx={{ color: '#5A6A7E', mb: 3, maxWidth: 450, textAlign: 'center' }}>
          Flip cards to find matching pairs. Each match reveals a climate fact!
          Try to match all {totalPairs} pairs in as few moves as possible.
        </Typography>
        <EcoButton onClick={startGame} size="large">Start Matching 🧠</EcoButton>
      </Box>
    );
  }

  // --- Leaderboard ---
  if (screen === 'leaderboard') {
    return (
      <Box sx={{
        minHeight: '100dvh', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        px: 3, py: 4,
      }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>🏆 Eco Memory Leaderboard</Typography>
        <Box sx={{ width: '100%', maxWidth: 500 }}>
          <LeaderboardPanel gameId="eco-memory" playerName={playerName} />
        </Box>
        <Box sx={{ mt: 4 }}>
          <EcoButton onClick={startGame}>Play Again</EcoButton>
        </Box>
      </Box>
    );
  }

  // --- Game Over ---
  if (screen === 'gameover') {
    const rating = moves <= totalPairs + 2 ? '🏆 Perfect!' : moves <= totalPairs * 2 ? '⭐ Great!' : moves <= totalPairs * 3 ? '👍 Good!' : '🌱 Keep Learning!';
    const memScore = Math.max(0, totalPairs * 100 - (moves - totalPairs) * 10);
    return (
      <Box sx={{
        height: '100dvh', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 3,
        overflow: 'hidden',
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }} align="center">All Matched! 🎉</Typography>
          <Typography variant="h5" sx={{ color: '#9B59B6', mb: 1 }} align="center">{rating}</Typography>
          <Typography sx={{ color: '#5A6A7E', mb: 3 }} align="center">
            Completed in {moves} moves ({totalPairs} pairs)
          </Typography>
        </motion.div>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(13,155,74,0.3)',
                fontSize: '1rem', outline: 'none', width: 160,
              }}
            />
            <EcoButton onClick={async () => {
              if (playerName.trim()) {
                const { submitScore } = await import('../../lib/supabase');
                await submitScore({ game_id: 'eco-memory', player_name: playerName.trim(), score: memScore });
              }
              setScreen('leaderboard');
            }}>🏆 Leaderboard</EcoButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <EcoButton onClick={startGame}>Play Again</EcoButton>
            <EcoButton onClick={() => setScreen('intro')} variant="secondary">Info</EcoButton>
          </Box>
        </Box>
      </Box>
    );
  }

  // --- Playing ---
  return (
    <Box sx={{
      height: '100dvh', bgcolor: '#F0F3F7', color: '#1A2332',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      px: 2, py: 1, overflow: 'hidden', width: '100vw',
    }}>
      {/* HUD */}
      <Box sx={{ display: 'flex', gap: 4, mb: 1, flexShrink: 0 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 11, color: '#5A6A7E' }}>MOVES</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{moves}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 11, color: '#5A6A7E' }}>MATCHES</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#9B59B6' }}>{matches}/{totalPairs}</Typography>
        </Box>
      </Box>

      {/* Card Grid — responsive, no layout shift */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${gap}px`,
        width: `min(95vw, ${isLandscape ? '80vh' : '95vw'})`,
        maxHeight: availH,
      }}>
        {cards.map(card => {
          const isOpen = card.flipped || card.matched;
          return (
            <Box
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              sx={{
                aspectRatio: '1',
                borderRadius: 2,
                cursor: card.matched ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: card.matched ? `${card.color}10` : '#FFFFFF',
                border: `2px solid ${card.matched ? card.color : isOpen ? card.color : '#D0D7E0'}`,
                boxShadow: isOpen ? `0 2px 8px ${card.color}20` : '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                '&:hover': !card.flipped && !card.matched ? {
                  borderColor: `${card.color}55`,
                  boxShadow: `0 2px 8px ${card.color}15`,
                } : {},
                opacity: card.matched ? 0.5 : 1,
                overflow: 'hidden',
                p: '6%',
              }}
            >
              {/* Icon — always same space */}
              <Box sx={{
                fontSize: 'clamp(20px, 5vw, 36px)',
                lineHeight: 1,
              }}>
                {isOpen ? card.emoji : '🌱'}
              </Box>
              {/* Label — always same height, hidden text for face-down */}
              <Box sx={{
                mt: 0.5,
                fontSize: 'clamp(7px, 1.8vw, 11px)',
                fontWeight: 700,
                color: isOpen ? card.color : 'transparent',
                textAlign: 'center',
                lineHeight: 1.1,
                minHeight: '1.2em',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }}>
                {isOpen ? card.label : '•'}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Fact popup */}
      <AnimatePresence>
        {fact && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
            <Box sx={{ px: 3, py: 1.5, borderRadius: 2, background: '#9B59B612', border: '1px solid #9B59B625', maxWidth: 400, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: '#9B59B6' }}>{fact}</Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

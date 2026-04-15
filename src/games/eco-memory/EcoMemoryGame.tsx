import { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { createCards, GHG_PAIRS } from './data';
import type { Card } from './data';
import EcoButton from '../../components/EcoButton';

type Screen = 'intro' | 'playing' | 'gameover';

export default function EcoMemoryGame() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [fact, setFact] = useState('');
  const [locked, setLocked] = useState(false);

  const totalPairs = GHG_PAIRS.length;

  const startGame = useCallback(() => {
    setCards(createCards());
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setFact('');
    setLocked(false);
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
          setFlipped([]);
          setLocked(false);
          setTimeout(() => setFact(''), 3000);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]);
          setLocked(false);
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
        height: '100vh', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        px: 3, py: 4, overflow: 'hidden',
      }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h3" sx={{
            background: 'linear-gradient(135deg, #9B59B6, #007DC4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, mb: 2,
          }} align="center">
            🧠 Eco Memory
          </Typography>
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

  // --- Game Over ---
  if (screen === 'gameover') {
    const rating = moves <= totalPairs + 2 ? '🏆 Perfect!' : moves <= totalPairs * 2 ? '⭐ Great!' : moves <= totalPairs * 3 ? '👍 Good!' : '🌱 Keep Learning!';
    return (
      <Box sx={{
        height: '100vh', bgcolor: '#FAFBFC', color: '#1A2332',
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <EcoButton onClick={startGame}>Play Again</EcoButton>
          <EcoButton onClick={() => setScreen('intro')} variant="secondary">Info</EcoButton>
        </Box>
      </Box>
    );
  }

  // --- Playing ---
  return (
    <Box sx={{
      height: '100vh', bgcolor: '#F0F3F7', color: '#1A2332',
      display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 2,
      overflow: 'hidden',
    }}>
      {/* HUD */}
      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, color: '#8892B0' }}>MOVES</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{moves}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, color: '#8892B0' }}>MATCHES</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#9B59B6' }}>{matches}/{totalPairs}</Typography>
        </Box>
      </Box>

      {/* Card Grid */}
      <Box sx={{
        display: 'grid', gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 1.5, maxWidth: 440, width: '100%',
      }}>
        <AnimatePresence>
          {cards.map(card => (
            <motion.div key={card.id} layout initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
              <Box
                onClick={() => handleCardClick(card.id)}
                sx={{
                  aspectRatio: '1', borderRadius: 2, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: card.matched
                    ? `${card.color}15`
                    : card.flipped
                      ? '#FFFFFF'
                      : '#FFFFFF',
                  border: `2px solid ${card.matched ? card.color : card.flipped ? card.color : '#E8EDF2'}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s',
                  '&:hover': !card.flipped && !card.matched ? { borderColor: `${card.color}55`, transform: 'scale(1.05)' } : {},
                  opacity: card.matched ? 0.6 : 1,
                  p: 1,
                }}
              >
                {card.flipped || card.matched ? (
                  <>
                    <Typography sx={{ fontSize: { xs: 24, sm: 32 } }}>{card.emoji}</Typography>
                    <Typography sx={{ fontSize: { xs: 8, sm: 10 }, color: card.color, fontWeight: 700, textAlign: 'center', mt: 0.5 }}>
                      {card.label}
                    </Typography>
                  </>
                ) : (
                  <Typography sx={{ fontSize: { xs: 28, sm: 36 } }}>🌱</Typography>
                )}
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      {/* Fact */}
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

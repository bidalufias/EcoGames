import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { BINS, WASTE_ITEMS, randomWaste, DIFFICULTY_LEVELS, PLAYFIELD_W } from './data';
import EcoButton from '../../components/EcoButton';
import LeaderboardPanel from '../../components/LeaderboardPanel';
import { useFitScale } from '../../lib/useFitScale';

const PLAYFIELD_NATURAL = { w: PLAYFIELD_W * 65, h: 500 };

interface FallingItem {
  id: number;
  waste: typeof WASTE_ITEMS[number];
  col: number;
  row: number;
  speed: number;
}

type Screen = 'intro' | 'playing' | 'gameover' | 'leaderboard';

export default function RecycleRushGame() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [playerName, setPlayerName] = useState('');
  const [items, setItems] = useState<FallingItem[]>([]);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [level, setLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [fact, setFact] = useState('');
  const [nextId, setNextId] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const { parentRef: fitRef, scale: fitScale } = useFitScale(PLAYFIELD_NATURAL);
  const stateRef = useRef({ score, lives, level, streak, sorted, mistakes, items, selectedBin, nextId });

  stateRef.current = { score, lives, level, streak, sorted, mistakes, items, selectedBin, nextId };

  const spawnItem = useCallback(() => {
    const s = stateRef.current;
    const lvl = DIFFICULTY_LEVELS[Math.min(s.level, 4)];
    const waste = randomWaste(s.level);
    const col = Math.floor(Math.random() * PLAYFIELD_W);
    const item: FallingItem = {
      id: s.nextId, waste, col, row: 0, speed: lvl.speed,
    };
    setNextId(n => n + 1);
    setItems(prev => [...prev, item]);
  }, []);

  const checkAnswer = useCallback((item: FallingItem, binId: string) => {
    const correct = item.waste.bin === binId;
    if (correct) {
      setScore(s => s + 10 + (stateRef.current.streak * 2));
      setStreak(s => s + 1);
      setSorted(s => s + 1);
      if ((stateRef.current.sorted + 1) % 10 === 0) {
        setLevel(l => Math.min(l + 1, 4));
      }
      if ((stateRef.current.streak + 1) % 5 === 0) {
        setFact(`💡 ${item.waste.fact}`);
        setTimeout(() => setFact(''), 3000);
      }
    } else {
      setLives(l => l - 1);
      setStreak(0);
      setMistakes(m => m + 1);
    }
    setItems(prev => prev.filter(i => i.id !== item.id));
    setSelectedBin(null);
  }, []);

  const startGame = useCallback(() => {
    setScore(0); setLives(5); setLevel(0); setStreak(0); setSorted(0); setMistakes(0);
    setItems([]); setNextId(0); setFact('');
    setScreen('playing');
  }, []);

  useEffect(() => {
    if (screen !== 'playing') return;
    const diff = DIFFICULTY_LEVELS[Math.min(level, 4)];
    let spawnTimer = 0;
    const interval = setInterval(() => {
      setItems(prev => {
        const updated = prev.map(item => ({ ...item, row: item.row + item.speed * 0.05 }));
        const missed = updated.filter(i => i.row >= 10);
        if (missed.length > 0) {
          setLives(l => Math.max(0, l - missed.length));
          setStreak(0);
        }
        return updated.filter(i => i.row < 10);
      });
      spawnTimer++;
      if (spawnTimer >= diff.spawnRate / 16) {
        spawnTimer = 0;
        spawnItem();
      }
    }, 16);
    return () => clearInterval(interval);
  }, [screen, level, spawnItem]);

  useEffect(() => {
    if (screen === 'playing' && lives <= 0) {
      setTimeout(() => setScreen('gameover'), 500);
    }
  }, [lives, screen]);

  const handleItemClick = useCallback((item: FallingItem) => {
    if (selectedBin) { checkAnswer(item, selectedBin); }
  }, [selectedBin, checkAnswer]);

  const handleBinClick = useCallback((binId: string) => {
    setSelectedBin(binId);
  }, []);

  // --- Intro ---
  if (screen === 'intro') {
    return (
      <Box sx={{
        height: '100%', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        px: 3, py: 4, overflow: 'hidden',
      }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h3" component="h1" sx={{
            color: '#C2410C', fontWeight: 800, mb: 2,
          }} align="center">
            📦 Recycle Rush
          </Typography>
          <Typography variant="h6" sx={{ color: '#5A6A7E', mb: 4 }} align="center">
            Sort waste at lightning speed. Learn what goes where!
          </Typography>
        </motion.div>

        <Box sx={{ maxWidth: 600, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1A2332' }}>🎯 The Bins:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
            {BINS.map(bin => (
              <Box key={bin.id} sx={{
                px: 2, py: 1, borderRadius: 2,
                background: `${bin.color}10`, border: `1px solid ${bin.color}30`,
                textAlign: 'center',
              }}>
                <Typography sx={{ fontSize: 28 }}>{bin.emoji}</Typography>
                <Typography sx={{ fontWeight: 700, color: bin.color, fontSize: 13 }}>{bin.name}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography sx={{ color: '#5A6A7E', mb: 3, maxWidth: 500, textAlign: 'center' }}>
          Select a bin, then tap falling waste to sort it! Wrong bin = lost life.
          Sort 10 items to level up. Speed increases each level!
        </Typography>

        <EcoButton onClick={startGame} size="large">Start Sorting 📦</EcoButton>
      </Box>
    );
  }

  // --- Leaderboard ---
  if (screen === 'leaderboard') {
    return (
      <Box sx={{
        minHeight: '100%', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        px: 3, py: 4,
      }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>🏆 Recycle Rush Leaderboard</Typography>
        <Box sx={{ width: '100%', maxWidth: 500 }}>
          <LeaderboardPanel gameId="recycle-rush" playerName={playerName} />
        </Box>
        <Box sx={{ mt: 4 }}>
          <EcoButton onClick={startGame}>Play Again</EcoButton>
        </Box>
      </Box>
    );
  }

  // --- Game Over ---
  if (screen === 'gameover') {
    return (
      <Box sx={{
        height: '100%', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        px: 3, overflow: 'hidden',
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }} align="center">Time's Up!</Typography>
          <Typography variant="h5" sx={{ color: '#FF8C42', mb: 1 }} align="center">
            Score: {score.toLocaleString()}
          </Typography>
          <Typography sx={{ color: '#5A6A7E', mb: 3 }} align="center">
            Sorted: {sorted} | Mistakes: {mistakes} | Level: {level + 1}
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
                await submitScore({ game_id: 'recycle-rush', player_name: playerName.trim(), score });
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
    <Box ref={gameRef} sx={{
      height: '100%', width: '100%', bgcolor: '#F0F3F7', color: '#1A2332',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pt: 'clamp(48px, 7cqh, 72px)', pb: 'clamp(12px, 2cqh, 24px)',
      px: 'clamp(8px, 2cqw, 24px)', gap: 'clamp(6px, 1.2cqh, 12px)',
      touchAction: 'none', userSelect: 'none', overflow: 'hidden',
    }}>
      {/* HUD */}
      <Box sx={{ display: 'flex', gap: 'clamp(12px, 2.5cqw, 24px)', alignItems: 'center', flexShrink: 0 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 'clamp(9px, 1.3cqh, 11px)', color: '#8892B0', letterSpacing: '0.1em' }}>SCORE</Typography>
          <Typography sx={{ fontSize: 'clamp(0.95rem, 2.4cqh, 1.2rem)', fontWeight: 800, color: '#FF8C42', lineHeight: 1.1 }}>{score}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 'clamp(9px, 1.3cqh, 11px)', color: '#8892B0', letterSpacing: '0.1em' }}>LIVES</Typography>
          <Typography sx={{ fontSize: 'clamp(0.95rem, 2.4cqh, 1.2rem)', fontWeight: 800, color: lives <= 2 ? '#E74C3C' : '#1A2332', lineHeight: 1.1 }}>
            {'🌍'.repeat(Math.max(0, lives))}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 'clamp(9px, 1.3cqh, 11px)', color: '#8892B0', letterSpacing: '0.1em' }}>LEVEL</Typography>
          <Typography sx={{ fontSize: 'clamp(0.95rem, 2.4cqh, 1.2rem)', fontWeight: 800, color: '#8BC53F', lineHeight: 1.1 }}>{level + 1}</Typography>
        </Box>
        {streak >= 3 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 'clamp(9px, 1.3cqh, 11px)', color: '#FF8C42', letterSpacing: '0.1em' }}>🔥 STREAK</Typography>
            <Typography sx={{ fontSize: 'clamp(0.95rem, 2.4cqh, 1.2rem)', fontWeight: 800, color: '#FF8C42', lineHeight: 1.1 }}>{streak}</Typography>
          </Box>
        )}
      </Box>

      {/* Bin selector */}
      <Box sx={{ display: 'flex', gap: 'clamp(4px, 1cqw, 10px)', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
        {BINS.map(bin => (
          <Box
            key={bin.id}
            onClick={() => handleBinClick(bin.id)}
            sx={{
              px: 'clamp(8px, 1.4cqw, 14px)', py: 'clamp(4px, 0.8cqh, 8px)', borderRadius: 2, cursor: 'pointer',
              background: selectedBin === bin.id ? `${bin.color}20` : '#FFFFFF',
              border: `2px solid ${selectedBin === bin.id ? bin.color : '#E8EDF2'}`,
              transition: 'all 0.15s',
              '&:hover': { borderColor: bin.color },
            }}
          >
            <Typography sx={{ fontSize: 'clamp(16px, 2.8cqh, 22px)' }}>{bin.emoji}</Typography>
          </Box>
        ))}
      </Box>

      {/* Playfield wrapper — fills remaining space; the natural-pixel
          playfield below is auto-scaled to fit. */}
      <Box
        ref={fitRef}
        sx={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%', display: 'grid', placeItems: 'center' }}
      >
        <Box sx={{
          position: 'relative',
          width: PLAYFIELD_NATURAL.w,
          height: PLAYFIELD_NATURAL.h,
          background: '#FFFFFF', borderRadius: 2,
          border: '1px solid #E8EDF2',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          transform: `scale(${fitScale})`,
          transformOrigin: 'center center',
        }}>
          <AnimatePresence>
            {items.map(item => (
              <motion.div key={item.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  position: 'absolute',
                  left: item.col * 65 + 7,
                  top: item.row * 45,
                  width: 52, height: 52,
                }}
              >
                <Box
                  onClick={() => selectedBin && handleItemClick(item)}
                  sx={{
                    width: '100%', height: '100%', borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, cursor: selectedBin ? 'pointer' : 'default',
                    background: selectedBin ? '#F8F9FB' : 'transparent',
                    border: selectedBin ? '1px solid #E8EDF2' : 'none',
                    transition: 'all 0.15s',
                    '&:hover': selectedBin ? { background: '#F0F3F7', transform: 'scale(1.1)' } : {},
                  }}
                  title={item.waste.name}
                >
                  {item.waste.emoji}
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </Box>

      {/* Fact */}
      <AnimatePresence>
        {fact && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
            <Box sx={{
              px: 3, py: 1.5, borderRadius: 2,
              background: '#FF8C4215', border: '1px solid #FF8C4230',
              maxWidth: 400, textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: 13, color: '#FF8C42' }}>{fact}</Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

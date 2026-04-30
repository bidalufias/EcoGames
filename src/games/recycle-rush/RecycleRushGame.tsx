import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BINS, WASTE_ITEMS, randomWaste, DIFFICULTY_LEVELS, PLAYFIELD_W,
  SPEED_PRESETS, comboMultiplier, randomPowerUp,
  type SpeedKey, type PowerUp,
} from './data';
import EcoButton from '../../components/EcoButton';
import LeaderboardPanel from '../../components/LeaderboardPanel';
import BackToHome from '../../components/BackToHome';
import MgtcLogo from '../../components/MgtcLogo';
import { useFitScale } from '../../lib/useFitScale';
import { sfxCorrect, sfxWrong, sfxLevelUp, sfxPowerUp, sfxGameOver, haptic } from './audio';

const PLAYFIELD_NATURAL = { w: PLAYFIELD_W * 65, h: 500 };
const POWERUP_CHANCE = 0.07;       // post-level-1 spawn replaces waste with a power-up
const SLOWMO_DURATION_MS = 5000;
const AUTOSORT_BURST = 3;

type WasteFalling = {
  kind: 'waste'; id: number;
  waste: typeof WASTE_ITEMS[number];
  col: number; row: number; speed: number;
};
type PowerUpFalling = {
  kind: 'powerup'; id: number;
  power: PowerUp;
  col: number; row: number; speed: number;
};
type FallingItem = WasteFalling | PowerUpFalling;

type Mistake = {
  itemEmoji: string;
  itemName: string;
  correct: typeof BINS[number];
  chosen: typeof BINS[number];
};

type FloatScore = { id: number; text: string; color: string; col: number; row: number };

type Screen = 'intro' | 'playing' | 'gameover' | 'leaderboard';

export default function RecycleRushGame() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [speedKey, setSpeedKey] = useState<SpeedKey>('normal');
  const [playerName, setPlayerName] = useState('');
  const [items, setItems] = useState<FallingItem[]>([]);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [level, setLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [mistakeLog, setMistakeLog] = useState<Mistake[]>([]);
  const [fact, setFact] = useState<{ text: string; tone: 'good' | 'bad' } | null>(null);
  const [floats, setFloats] = useState<FloatScore[]>([]);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const [slowMoUntil, setSlowMoUntil] = useState(0);
  const [autoSortLeft, setAutoSortLeft] = useState(0);
  const [nextId, setNextId] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const floatIdRef = useRef(0);
  const { parentRef: fitRef, scale: fitScale } = useFitScale(PLAYFIELD_NATURAL);
  const stateRef = useRef({
    score, lives, level, streak, sorted, mistakes, items,
    selectedBin, selectedItemId, nextId, slowMoUntil, autoSortLeft,
  });

  stateRef.current = {
    score, lives, level, streak, sorted, mistakes, items,
    selectedBin, selectedItemId, nextId, slowMoUntil, autoSortLeft,
  };

  const speedPreset = SPEED_PRESETS[speedKey];

  const pushFloat = useCallback((text: string, color: string, col: number, row: number) => {
    const id = floatIdRef.current++;
    setFloats(f => [...f, { id, text, color, col, row }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 800);
  }, []);

  const triggerFlash = useCallback((tone: 'good' | 'bad') => {
    setFlash(tone);
    setTimeout(() => setFlash(null), 220);
  }, []);

  const spawnItem = useCallback(() => {
    const s = stateRef.current;
    const lvl = DIFFICULTY_LEVELS[Math.min(s.level, 4)];
    const col = Math.floor(Math.random() * PLAYFIELD_W);
    const id = s.nextId;
    const adjustedSpeed = lvl.speed * speedPreset.speedMul;
    setNextId(n => n + 1);
    // Power-ups can drop after the first level — slightly slower so they're
    // catchable without disrupting the rhythm of waste sorting.
    const dropsPowerUp = s.level >= 1 && Math.random() < POWERUP_CHANCE;
    if (dropsPowerUp) {
      setItems(prev => [...prev, {
        kind: 'powerup', id, power: randomPowerUp(),
        col, row: 0, speed: adjustedSpeed * 0.8,
      }]);
    } else {
      setItems(prev => [...prev, {
        kind: 'waste', id, waste: randomWaste(s.level),
        col, row: 0, speed: adjustedSpeed,
      }]);
    }
  }, [speedPreset]);

  const checkAnswer = useCallback((item: WasteFalling, binId: string) => {
    const correct = item.waste.bin === binId;
    if (correct) {
      const nextStreak = stateRef.current.streak + 1;
      const mul = comboMultiplier(nextStreak);
      const earned = Math.round(10 * mul);
      setScore(s => s + earned);
      setStreak(nextStreak);
      setSorted(s => s + 1);
      pushFloat(`+${earned}${mul > 1 ? ` ×${mul}` : ''}`, '#4CAF50', item.col, item.row);
      triggerFlash('good');
      sfxCorrect(); haptic(20);
      if ((stateRef.current.sorted + 1) % 10 === 0) {
        setLevel(l => Math.min(l + 1, 4));
        sfxLevelUp(); haptic([0, 30, 50, 30]);
      }
      if (nextStreak % 5 === 0) {
        setFact({ text: `💡 ${item.waste.fact}`, tone: 'good' });
        setTimeout(() => setFact(null), 3000);
      }
    } else {
      const chosen = BINS.find(b => b.id === binId)!;
      const correctBin = BINS.find(b => b.id === item.waste.bin)!;
      setLives(l => l - 1);
      setStreak(0);
      setMistakes(m => m + 1);
      setMistakeLog(log => [
        ...log,
        { itemEmoji: item.waste.emoji, itemName: item.waste.name, correct: correctBin, chosen },
      ].slice(-10));
      pushFloat(`✗ ${correctBin.emoji}`, '#E74C3C', item.col, item.row);
      triggerFlash('bad');
      sfxWrong(); haptic([30, 40, 30]);
      // On wrong sorts, surface the correct bin + a relevant fact so the
      // mistake becomes a learning moment instead of just a lost life.
      setFact({
        text: `${item.waste.emoji} ${item.waste.name} → ${correctBin.emoji} ${correctBin.name} · ${item.waste.fact}`,
        tone: 'bad',
      });
      setTimeout(() => setFact(null), 2600);
    }
    setItems(prev => prev.filter(i => i.id !== item.id));
    setSelectedBin(null);
    setSelectedItemId(null);
  }, [pushFloat, triggerFlash]);

  const activatePowerUp = useCallback((item: PowerUpFalling) => {
    const p = item.power;
    sfxPowerUp(); haptic([0, 20, 40, 20]);
    pushFloat(`${p.emoji} ${p.name}`, '#9C27B0', item.col, item.row);
    if (p.id === 'heart')  setLives(l => Math.min(l + 1, 5));
    if (p.id === 'slowmo') setSlowMoUntil(Date.now() + SLOWMO_DURATION_MS);
    if (p.id === 'magnet') setAutoSortLeft(n => n + AUTOSORT_BURST);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setSelectedItemId(null);
  }, [pushFloat]);

  const startGame = useCallback(() => {
    setScore(0); setLives(5); setLevel(0); setStreak(0); setSorted(0); setMistakes(0);
    setItems([]); setNextId(0); setFact(null); setMistakeLog([]);
    setSelectedBin(null); setSelectedItemId(null);
    setSlowMoUntil(0); setAutoSortLeft(0);
    setScreen('playing');
  }, []);

  // Main game loop — falling items + spawn cadence. Slow-mo halves the
  // per-tick fall step (and only the fall step, so spawn rate is unaffected).
  useEffect(() => {
    if (screen !== 'playing') return;
    const diff = DIFFICULTY_LEVELS[Math.min(level, 4)];
    const adjustedSpawn = diff.spawnRate * speedPreset.spawnMul;
    let spawnTimer = 0;
    const interval = setInterval(() => {
      const slow = Date.now() < stateRef.current.slowMoUntil ? 0.5 : 1;
      setItems(prev => {
        const updated = prev.map(item => ({ ...item, row: item.row + item.speed * 0.05 * slow }));
        const wasteMissed = updated.filter(i => i.row >= 10 && i.kind === 'waste').length;
        if (wasteMissed > 0) {
          setLives(l => Math.max(0, l - wasteMissed));
          setStreak(0);
        }
        return updated.filter(i => i.row < 10);
      });
      spawnTimer++;
      if (spawnTimer >= adjustedSpawn / 16) {
        spawnTimer = 0;
        spawnItem();
      }
    }, 16);
    return () => clearInterval(interval);
  }, [screen, level, spawnItem, speedPreset]);

  // Magnet power-up: auto-sort the lowest waste item every 600ms until the
  // burst is exhausted. Reads items from the ref so the interval doesn't
  // restart on every fall-tick state update.
  useEffect(() => {
    if (screen !== 'playing' || autoSortLeft <= 0) return;
    const tick = () => {
      const lowest = stateRef.current.items
        .filter((i): i is WasteFalling => i.kind === 'waste')
        .sort((a, b) => b.row - a.row)[0];
      if (lowest) {
        checkAnswer(lowest, lowest.waste.bin);
        setAutoSortLeft(n => Math.max(0, n - 1));
      }
    };
    const t = setInterval(tick, 600);
    return () => clearInterval(t);
  }, [screen, autoSortLeft, checkAnswer]);

  // Keyboard 1-5: instantly sort the lowest waste item into that bin.
  useEffect(() => {
    if (screen !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      const idx = ['1', '2', '3', '4', '5'].indexOf(e.key);
      if (idx === -1) return;
      const bin = BINS[idx];
      if (!bin) return;
      e.preventDefault();
      const lowest = stateRef.current.items
        .filter((i): i is WasteFalling => i.kind === 'waste')
        .sort((a, b) => b.row - a.row)[0];
      if (lowest) checkAnswer(lowest, bin.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, checkAnswer]);

  useEffect(() => {
    if (screen === 'playing' && lives <= 0) {
      sfxGameOver();
      setTimeout(() => setScreen('gameover'), 500);
    }
  }, [lives, screen]);

  // Click on an item: power-ups activate immediately; for waste, either
  // sort with the current bin selection or stage the item for a follow-up
  // bin tap (so users can pick item-first or bin-first interchangeably).
  const handleItemClick = useCallback((item: FallingItem) => {
    if (item.kind === 'powerup') {
      activatePowerUp(item);
      return;
    }
    if (selectedBin) {
      checkAnswer(item, selectedBin);
      return;
    }
    setSelectedItemId(prev => (prev === item.id ? null : item.id));
  }, [selectedBin, checkAnswer, activatePowerUp]);

  const handleBinClick = useCallback((binId: string) => {
    if (selectedItemId != null) {
      const it = stateRef.current.items.find(i => i.id === selectedItemId);
      if (it && it.kind === 'waste') {
        checkAnswer(it, binId);
        return;
      }
    }
    setSelectedBin(prev => (prev === binId ? null : binId));
  }, [selectedItemId, checkAnswer]);

  const slowMoActive = slowMoUntil > Date.now();
  const slowMoSecondsLeft = Math.max(0, Math.ceil((slowMoUntil - Date.now()) / 1000));
  // Tick the HUD once a second while slow-mo is active so the countdown updates.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!slowMoActive) return;
    const t = setInterval(() => forceTick(n => n + 1), 250);
    return () => clearInterval(t);
  }, [slowMoActive]);

  const multiplier = comboMultiplier(streak);

  // --- Intro ---
  if (screen === 'intro') {
    return (
      <>
        <BackToHome />
        <MgtcLogo />
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

        <Typography sx={{ color: '#5A6A7E', mb: 2, maxWidth: 520, textAlign: 'center' }}>
          Tap a bin then tap an item — or press <b>1–5</b> to throw the lowest item.
          Catch power-ups (❤️ ⏱️ 🧲), build streaks for combo multipliers,
          and sort 10 items to level up.
        </Typography>

        <Box sx={{ mb: 2.5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, color: '#8892B0', letterSpacing: '0.1em', mb: 1 }}>GAME SPEED</Typography>
          <Box sx={{ display: 'flex', gap: 1.2, justifyContent: 'center' }}>
            {(Object.keys(SPEED_PRESETS) as SpeedKey[]).map(key => {
              const p = SPEED_PRESETS[key];
              const active = speedKey === key;
              return (
                <Box
                  key={key}
                  onClick={() => setSpeedKey(key)}
                  sx={{
                    px: 2, py: 1, borderRadius: 2, cursor: 'pointer',
                    border: `2px solid ${active ? '#FF8C42' : '#E8EDF2'}`,
                    background: active ? '#FF8C4215' : '#FFFFFF',
                    minWidth: 84, textAlign: 'center',
                    transition: 'all 0.15s',
                    '&:hover': { borderColor: '#FF8C42' },
                  }}
                >
                  <Typography sx={{ fontSize: 22, lineHeight: 1 }}>{p.emoji}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: active ? '#C2410C' : '#1A2332' }}>
                    {p.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <EcoButton onClick={startGame} size="large">Start Sorting 📦</EcoButton>
      </Box>
      </>
    );
  }

  // --- Leaderboard ---
  if (screen === 'leaderboard') {
    return (
      <>
        <BackToHome />
        <MgtcLogo />
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
      </>
    );
  }

  // --- Game Over ---
  if (screen === 'gameover') {
    return (
      <>
        <BackToHome />
        <MgtcLogo />
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
          <Typography sx={{ color: '#5A6A7E', mb: 2 }} align="center">
            Sorted: {sorted} | Mistakes: {mistakes} | Level: {level + 1}
          </Typography>
        </motion.div>

        {mistakeLog.length > 0 && (
          <Box sx={{
            width: 'min(520px, 92%)', mb: 2.5, px: 2, py: 1.5, borderRadius: 2,
            background: '#FFFFFF', border: '1px solid #E8EDF2',
          }}>
            <Typography sx={{ fontSize: 11, color: '#8892B0', letterSpacing: '0.1em', mb: 1, textAlign: 'center' }}>
              REVIEW · {mistakeLog.length} MISTAKE{mistakeLog.length === 1 ? '' : 'S'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, maxHeight: 160, overflow: 'auto' }}>
              {mistakeLog.slice(-5).reverse().map((m, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.2,
                  fontSize: 13, color: '#1A2332',
                }}>
                  <Box component="span" sx={{ fontSize: 18 }}>{m.itemEmoji}</Box>
                  <Box component="span" sx={{ minWidth: 96, color: '#5A6A7E' }}>{m.itemName}</Box>
                  <Box component="span" sx={{ color: m.chosen.color, opacity: 0.7 }}>
                    {m.chosen.emoji} {m.chosen.name}
                  </Box>
                  <Box component="span" sx={{ color: '#8892B0' }}>→</Box>
                  <Box component="span" sx={{ color: m.correct.color, fontWeight: 700 }}>
                    {m.correct.emoji} {m.correct.name}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
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
            <EcoButton onClick={() => setScreen('intro')} variant="secondary">Menu</EcoButton>
          </Box>
        </Box>
      </Box>
      </>
    );
  }

  // --- Playing ---
  return (
    <Box ref={gameRef} sx={{
      position: 'relative',
      height: '100%', width: '100%', bgcolor: '#F0F3F7', color: '#1A2332',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pt: 'clamp(16px, 2.5cqh, 28px)', pb: 'clamp(12px, 2cqh, 24px)',
      px: 'clamp(8px, 2cqw, 24px)', gap: 'clamp(6px, 1.2cqh, 12px)',
      touchAction: 'none', userSelect: 'none', overflow: 'hidden',
    }}>
      {/* In-game Menu button — single way back to the intro screen
          since the global header is hidden during play. */}
      <Box sx={{ position: 'absolute', top: 'clamp(8px, 1.5cqh, 16px)', right: 'clamp(8px, 1.5cqw, 16px)', zIndex: 20 }}>
        <EcoButton size="small" variant="ghost" onClick={() => setScreen('intro')}>Menu</EcoButton>
      </Box>
      {/* HUD */}
      <Box sx={{ display: 'flex', gap: 'clamp(12px, 2.5cqw, 24px)', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 'clamp(9px, 1.3cqh, 11px)', color: '#8892B0', letterSpacing: '0.1em' }}>SCORE</Typography>
          <Typography sx={{ fontSize: 'clamp(0.95rem, 2.4cqh, 1.2rem)', fontWeight: 800, color: '#FF8C42', lineHeight: 1.1 }}>{score}</Typography>
        </Box>
        {multiplier > 1 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 'clamp(9px, 1.3cqh, 11px)', color: '#FF8C42', letterSpacing: '0.1em' }}>COMBO</Typography>
            <Typography sx={{ fontSize: 'clamp(0.95rem, 2.4cqh, 1.2rem)', fontWeight: 800, color: '#FF8C42', lineHeight: 1.1 }}>×{multiplier}</Typography>
          </Box>
        )}
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
        {slowMoActive && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 'clamp(9px, 1.3cqh, 11px)', color: '#3F86E0', letterSpacing: '0.1em' }}>⏱️ SLOW</Typography>
            <Typography sx={{ fontSize: 'clamp(0.95rem, 2.4cqh, 1.2rem)', fontWeight: 800, color: '#3F86E0', lineHeight: 1.1 }}>
              {slowMoSecondsLeft}s
            </Typography>
          </Box>
        )}
        {autoSortLeft > 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 'clamp(9px, 1.3cqh, 11px)', color: '#9C27B0', letterSpacing: '0.1em' }}>🧲 AUTO</Typography>
            <Typography sx={{ fontSize: 'clamp(0.95rem, 2.4cqh, 1.2rem)', fontWeight: 800, color: '#9C27B0', lineHeight: 1.1 }}>{autoSortLeft}</Typography>
          </Box>
        )}
      </Box>

      {/* Bin selector — 1-5 keyboard hints always visible; bin names show
          on the first level (and again whenever the player is selecting). */}
      <Box sx={{ display: 'flex', gap: 'clamp(4px, 1cqw, 10px)', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
        {BINS.map((bin, idx) => {
          const showLabel = level === 0;
          const active = selectedBin === bin.id;
          return (
            <Box
              key={bin.id}
              onClick={() => handleBinClick(bin.id)}
              sx={{
                position: 'relative',
                px: 'clamp(8px, 1.4cqw, 14px)', py: 'clamp(4px, 0.8cqh, 8px)', borderRadius: 2, cursor: 'pointer',
                background: active ? `${bin.color}20` : '#FFFFFF',
                border: `2px solid ${active ? bin.color : '#E8EDF2'}`,
                transition: 'all 0.15s',
                textAlign: 'center',
                minWidth: 52,
                '&:hover': { borderColor: bin.color },
              }}
            >
              <Box
                sx={{
                  position: 'absolute', top: -7, left: -7,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#1A2332', color: '#FFFFFF',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                {idx + 1}
              </Box>
              <Typography sx={{ fontSize: 'clamp(16px, 2.8cqh, 22px)', lineHeight: 1 }}>{bin.emoji}</Typography>
              {showLabel && (
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: bin.color, mt: 0.3, letterSpacing: '0.02em' }}>
                  {bin.name}
                </Typography>
              )}
            </Box>
          );
        })}
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
          {/* Slow-mo blue tint sits behind everything */}
          {slowMoActive && (
            <Box sx={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(63,134,224,0.08), rgba(63,134,224,0.02))',
              zIndex: 1,
            }} />
          )}
          <AnimatePresence>
            {items.map(item => {
              const isSelected = item.kind === 'waste' && selectedItemId === item.id;
              const isPower = item.kind === 'powerup';
              const emoji = isPower ? item.power.emoji : item.waste.emoji;
              const title = isPower ? `${item.power.name} — ${item.power.desc}` : item.waste.name;
              return (
                <motion.div key={item.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: isPower ? [1, 1.08, 1] : 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={isPower ? { scale: { repeat: Infinity, duration: 1.2 } } : undefined}
                  style={{
                    position: 'absolute',
                    left: item.col * 65 + 7,
                    top: item.row * 45,
                    width: 52, height: 52,
                    zIndex: 2,
                  }}
                >
                  <Box
                    onClick={() => handleItemClick(item)}
                    sx={{
                      width: '100%', height: '100%', borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 32, cursor: 'pointer',
                      background: isPower
                        ? 'radial-gradient(circle, #9C27B025, #9C27B005 70%)'
                        : isSelected ? '#FF8C4220' : (selectedBin ? '#F8F9FB' : 'transparent'),
                      border: isPower
                        ? '2px solid #9C27B0'
                        : isSelected ? '2px solid #FF8C42' : (selectedBin ? '1px solid #E8EDF2' : 'none'),
                      boxShadow: isPower ? '0 0 12px rgba(156,39,176,0.4)' : 'none',
                      transition: 'all 0.15s',
                      '&:hover': { background: isPower ? 'radial-gradient(circle, #9C27B040, #9C27B010 70%)' : '#F0F3F7', transform: 'scale(1.1)' },
                    }}
                    title={title}
                  >
                    {emoji}
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Floating "+15 ×1.5" score popups, anchored to where the sort happened */}
          <AnimatePresence>
            {floats.map(f => (
              <motion.div key={f.id}
                initial={{ opacity: 0, y: 0, scale: 0.7 }}
                animate={{ opacity: 1, y: -34, scale: 1 }}
                exit={{ opacity: 0, y: -56 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: f.col * 65 + 7,
                  top: f.row * 45,
                  width: 52,
                  textAlign: 'center',
                  pointerEvents: 'none',
                  fontWeight: 800,
                  color: f.color,
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  fontSize: 14,
                  zIndex: 5,
                }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Brief tint flash on every sort — green = correct, red = wrong */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: flash === 'good' ? 'rgba(76,175,80,0.18)' : 'rgba(231,76,60,0.22)',
                  pointerEvents: 'none',
                  zIndex: 4,
                }}
              />
            )}
          </AnimatePresence>
        </Box>
      </Box>

      {/* Fact — green tint on streak milestones, red tint on wrong sorts */}
      <AnimatePresence>
        {fact && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: 'min(420px, 90%)' }}>
            <Box sx={{
              px: 3, py: 1.5, borderRadius: 2,
              background: fact.tone === 'good' ? '#FF8C4215' : '#E74C3C15',
              border: `1px solid ${fact.tone === 'good' ? '#FF8C4230' : '#E74C3C40'}`,
              textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: 13, color: fact.tone === 'good' ? '#FF8C42' : '#C0392B', lineHeight: 1.4 }}>
                {fact.text}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

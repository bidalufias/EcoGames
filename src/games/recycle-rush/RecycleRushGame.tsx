import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BINS, WASTE_ITEMS, randomWaste, DIFFICULTY_LEVELS, PLAYFIELD_W,
  CELL_W, CELL_H, ITEM_SIZE, MISS_ROW, FALL_STEP,
  PLAYFIELD_W_PX, PLAYFIELD_H_PX, BIN_TRAY_H,
  SPEED_PRESETS, comboMultiplier, randomPowerUp,
  type SpeedKey, type PowerUp,
} from './data';
import EcoButton from '../../components/EcoButton';
import LeaderboardPanel from '../../components/LeaderboardPanel';
import BackToHome from '../../components/BackToHome';
import MgtcLogo from '../../components/MgtcLogo';
import { useFitScale } from '../../lib/useFitScale';
import { sfxCorrect, sfxWrong, sfxLevelUp, sfxPowerUp, sfxGameOver, haptic } from './audio';

// Natural-pixel size of the combined playfield + bin tray. Both live
// inside one scaled container so the bins are exactly under the lanes.
const STAGE_NATURAL = { w: PLAYFIELD_W_PX, h: PLAYFIELD_H_PX + BIN_TRAY_H };
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

type UnlockedFact = {
  type: string;            // dedup key — never list the same item twice
  emoji: string;
  name: string;
  bin: typeof BINS[number];
  text: string;
  source: 'streak' | 'mistake';
};

type Screen = 'intro' | 'playing' | 'gameover' | 'leaderboard';

export default function RecycleRushGame() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [speedKey, setSpeedKey] = useState<SpeedKey>('normal');
  const [playerName, setPlayerName] = useState('');
  const [items, setItems] = useState<FallingItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [level, setLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [mistakeLog, setMistakeLog] = useState<Mistake[]>([]);
  // Cumulative list of unlocked "Did you know?" facts. Each fact is a
  // teaching moment — earned via a 5-streak or revealed after a wrong
  // sort — that stays visible in the side panel for the rest of the run.
  const [unlockedFacts, setUnlockedFacts] = useState<UnlockedFact[]>([]);
  const [floats, setFloats] = useState<FloatScore[]>([]);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const [slowMoUntil, setSlowMoUntil] = useState(0);
  const [autoSortLeft, setAutoSortLeft] = useState(0);
  const [nextId, setNextId] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const floatIdRef = useRef(0);
  const { parentRef: fitRef, scale: fitScale } = useFitScale(STAGE_NATURAL);
  const stateRef = useRef({
    score, lives, level, streak, sorted, mistakes, items,
    selectedItemId, nextId, slowMoUntil, autoSortLeft,
  });

  stateRef.current = {
    score, lives, level, streak, sorted, mistakes, items,
    selectedItemId, nextId, slowMoUntil, autoSortLeft,
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

  // Append (or move-to-top) an unlocked fact for an item. Dedup by waste
  // type so the panel never repeats — each item type teaches once.
  const recordFact = useCallback((
    item: WasteFalling,
    correctBin: typeof BINS[number],
    source: 'streak' | 'mistake',
  ) => {
    setUnlockedFacts(prev => {
      const without = prev.filter(f => f.type !== item.waste.type);
      return [{
        type: item.waste.type,
        emoji: item.waste.emoji,
        name: item.waste.name,
        bin: correctBin,
        text: item.waste.fact,
        source,
      }, ...without];
    });
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

  // Resolves a waste item once it has landed in its current lane. The bin
  // it lands in is determined purely by item.col → BINS[col]. The player
  // moves items between lanes during the fall; landing is automatic.
  const resolveLanding = useCallback((item: WasteFalling) => {
    const chosen = BINS[item.col];
    const correctBin = BINS.find(b => b.id === item.waste.bin)!;
    const correct = chosen?.id === item.waste.bin;
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
        recordFact(item, correctBin, 'streak');
      }
    } else {
      setLives(l => l - 1);
      setStreak(0);
      setMistakes(m => m + 1);
      setMistakeLog(log => [
        ...log,
        { itemEmoji: item.waste.emoji, itemName: item.waste.name, correct: correctBin, chosen: chosen ?? correctBin },
      ].slice(-10));
      pushFloat(`✗ ${correctBin.emoji}`, '#E74C3C', item.col, item.row);
      triggerFlash('bad');
      sfxWrong(); haptic([30, 40, 30]);
      // Wrong sorts also unlock the fact — so missed items still teach.
      recordFact(item, correctBin, 'mistake');
    }
  }, [pushFloat, triggerFlash]);

  // Move a single waste item to the chosen lane. If no item is selected,
  // the lowest waste item (most urgent) is moved.
  const moveToLane = useCallback((targetCol: number) => {
    const items = stateRef.current.items;
    const selectedId = stateRef.current.selectedItemId;
    let target: WasteFalling | undefined;
    if (selectedId != null) {
      const it = items.find(i => i.id === selectedId);
      if (it && it.kind === 'waste') target = it;
    }
    if (!target) {
      target = items
        .filter((i): i is WasteFalling => i.kind === 'waste')
        .sort((a, b) => b.row - a.row)[0];
    }
    if (!target) return;
    const id = target.id;
    setItems(prev => prev.map(i => (i.id === id ? { ...i, col: targetCol } : i)));
    setSelectedItemId(null);
  }, []);

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
    setItems([]); setNextId(0); setMistakeLog([]); setUnlockedFacts([]);
    setSelectedItemId(null);
    setSlowMoUntil(0); setAutoSortLeft(0);
    setScreen('playing');
  }, []);

  // Main game loop — falling items + spawn cadence. Items resolve on
  // landing using their CURRENT lane (item.col) → BINS[col]. The player
  // moves items between lanes during the fall; landing is automatic.
  useEffect(() => {
    if (screen !== 'playing') return;
    const diff = DIFFICULTY_LEVELS[Math.min(level, 4)];
    const adjustedInterval = diff.spawnInterval * speedPreset.spawnMul; // ms
    let spawnTimerMs = 0;
    const interval = setInterval(() => {
      const slow = Date.now() < stateRef.current.slowMoUntil ? 0.5 : 1;
      const prev = stateRef.current.items;
      const updated = prev.map(item => ({ ...item, row: item.row + item.speed * FALL_STEP * slow }));
      const landed = updated.filter(i => i.row >= MISS_ROW);
      const remaining = updated.filter(i => i.row < MISS_ROW);
      setItems(remaining);
      for (const item of landed) {
        // Power-ups silently disappear if not collected — no penalty.
        if (item.kind === 'waste') resolveLanding(item);
      }
      spawnTimerMs += 16;
      if (spawnTimerMs >= adjustedInterval) {
        // Cap waste only — power-ups are bonus drops and exempt from the cap.
        const wasteOnScreen = remaining.filter(i => i.kind === 'waste').length;
        if (wasteOnScreen < diff.maxConcurrent) {
          spawnTimerMs = 0;
          spawnItem();
        }
        // If the cap is full we leave the timer at threshold; the next
        // landing frees a slot and the very next tick spawns immediately.
      }
    }, 16);
    return () => clearInterval(interval);
  }, [screen, level, spawnItem, speedPreset, resolveLanding]);

  // Magnet power-up: every 600ms, snap the lowest waste item to its
  // correct lane so it resolves cleanly when it lands. Reads items via
  // stateRef so the interval doesn't restart on every fall-tick.
  useEffect(() => {
    if (screen !== 'playing' || autoSortLeft <= 0) return;
    const tick = () => {
      const lowest = stateRef.current.items
        .filter((i): i is WasteFalling => i.kind === 'waste')
        .sort((a, b) => b.row - a.row)[0];
      if (lowest) {
        const correctCol = BINS.findIndex(b => b.id === lowest.waste.bin);
        if (correctCol >= 0) {
          setItems(prev => prev.map(i =>
            i.id === lowest.id ? { ...i, col: correctCol } : i,
          ));
        }
        setAutoSortLeft(n => Math.max(0, n - 1));
      }
    };
    const t = setInterval(tick, 600);
    return () => clearInterval(t);
  }, [screen, autoSortLeft]);

  // Keyboard 1-5 / Arrow keys: 1-5 moves the active item to that lane;
  // ←/→ nudge the active item one lane left or right.
  useEffect(() => {
    if (screen !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      const numIdx = ['1', '2', '3', '4', '5'].indexOf(e.key);
      if (numIdx !== -1) {
        e.preventDefault();
        moveToLane(numIdx);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const dir = e.key === 'ArrowLeft' ? -1 : 1;
        // Pick the active waste item: explicit selection > lowest.
        const items = stateRef.current.items;
        const selectedId = stateRef.current.selectedItemId;
        let target: WasteFalling | undefined;
        if (selectedId != null) {
          const it = items.find(i => i.id === selectedId);
          if (it && it.kind === 'waste') target = it;
        }
        if (!target) {
          target = items
            .filter((i): i is WasteFalling => i.kind === 'waste')
            .sort((a, b) => b.row - a.row)[0];
        }
        if (!target) return;
        const next = Math.max(0, Math.min(PLAYFIELD_W - 1, target.col + dir));
        if (next === target.col) return;
        const id = target.id;
        setItems(prev => prev.map(i => (i.id === id ? { ...i, col: next } : i)));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, moveToLane]);

  useEffect(() => {
    if (screen === 'playing' && lives <= 0) {
      sfxGameOver();
      setTimeout(() => setScreen('gameover'), 500);
    }
  }, [lives, screen]);

  // Click on an item: power-ups activate immediately; waste items just
  // toggle their selection state (next bin click moves THIS item rather
  // than the lowest one).
  const handleItemClick = useCallback((item: FallingItem) => {
    if (item.kind === 'powerup') {
      activatePowerUp(item);
      return;
    }
    setSelectedItemId(prev => (prev === item.id ? null : item.id));
  }, [activatePowerUp]);

  // Click a bin: move the active item (selected, else lowest) into that
  // bin's lane. The item finishes falling and resolves on landing.
  const handleBinClick = useCallback((binIdx: number) => {
    moveToLane(binIdx);
  }, [moveToLane]);

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

  // The "active" waste item is the one a bin click / 1–5 / arrow key will
  // act on next: explicit selection wins, else the lowest (most urgent).
  // We highlight the bin under its lane so the destination is obvious.
  const activeWasteItem: WasteFalling | undefined = (() => {
    if (selectedItemId != null) {
      const it = items.find(i => i.id === selectedItemId);
      if (it && it.kind === 'waste') return it;
    }
    return items
      .filter((i): i is WasteFalling => i.kind === 'waste')
      .sort((a, b) => b.row - a.row)[0];
  })();
  const activeCol = activeWasteItem?.col ?? -1;

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

        <Typography sx={{ color: '#5A6A7E', mb: 2, maxWidth: 540, textAlign: 'center' }}>
          Each bin sits under one of 5 lanes. Items fall in random lanes —
          tap a bin (or press <b>1–5</b>, or use <b>← →</b>) to slide the
          active item into the right lane before it lands. Catch power-ups
          (❤️ ⏱️ 🧲), build streaks for combo multipliers, and sort 10 items
          to level up.
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

      {/* 3-column main row: active-item panel | stage | fact panel.
          Side panels keep the playfield free of overlapping toasts. */}
      <Box sx={{
        flex: 1, minHeight: 0, minWidth: 0, width: '100%',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 'clamp(6px, 1.4cqw, 18px)',
      }}>
        {/* Left panel — identifies the currently active item so the
            player knows what they're sorting at a glance. */}
        <Box sx={{
          flex: '0 0 auto',
          width: 'clamp(140px, 18cqw, 220px)',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          pt: 1,
        }}>
          <Typography sx={{ fontSize: 11, color: '#8892B0', letterSpacing: '0.12em', mb: 1, fontWeight: 700 }}>
            NOW FALLING
          </Typography>
          {activeWasteItem ? (() => {
            const trajectoryBin = BINS[activeWasteItem.col];
            const isCorrectLane = trajectoryBin?.id === activeWasteItem.waste.bin;
            return (
            <Box sx={{
              width: '100%',
              borderRadius: 2,
              background: isCorrectLane
                ? 'linear-gradient(180deg, #E8F5E9, #C8E6C9)'
                : 'linear-gradient(180deg, #FFFFFF, #F5F7FA)',
              border: isCorrectLane ? '2px solid #4CAF50' : '1px solid #E8EDF2',
              boxShadow: isCorrectLane
                ? '0 4px 12px rgba(76,175,80,0.30)'
                : '0 2px 6px rgba(0,0,0,0.05)',
              transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
              p: 1.5,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 0.6,
            }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(180deg, #FFFFFF, #F2F4F8)',
                border: '2px solid rgba(26,35,50,0.10)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36,
              }}>
                {activeWasteItem.waste.emoji}
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1A2332', textAlign: 'center', lineHeight: 1.2 }}>
                {activeWasteItem.waste.name}
              </Typography>
              {trajectoryBin && (
                <Box sx={{ mt: 0.6, textAlign: 'center' }}>
                  <Typography sx={{
                    fontSize: 10,
                    color: isCorrectLane ? '#2E7D32' : '#8892B0',
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                  }}>
                    {isCorrectLane
                      ? `✓ CORRECT LANE`
                      : `LANE ${activeWasteItem.col + 1} →`}
                  </Typography>
                  <Typography sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isCorrectLane ? '#2E7D32' : trajectoryBin.color,
                    mt: 0.2,
                  }}>
                    {trajectoryBin.emoji} {trajectoryBin.name}
                  </Typography>
                </Box>
              )}
              <Typography sx={{ fontSize: 10, color: '#8892B0', mt: 0.6, textAlign: 'center', lineHeight: 1.4 }}>
                Tap a bin or press <b>1–5</b> · arrows nudge ←→
              </Typography>
            </Box>
            );
          })() : (
            <Box sx={{
              width: '100%',
              borderRadius: 2,
              background: '#FAFBFC',
              border: '1px dashed #D4DBE5',
              p: 2,
              textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: 26, opacity: 0.4 }}>📦</Typography>
              <Typography sx={{ fontSize: 12, color: '#8892B0', mt: 0.5 }}>
                Waiting for next item…
              </Typography>
            </Box>
          )}
        </Box>

        {/* Stage — playfield + bin tray live inside one natural-pixel
            container that scales as a unit, so each bin is exactly under
            its lane and falling items drop straight into the right slot. */}
        <Box
          ref={fitRef}
          sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'grid', placeItems: 'center' }}
        >
          <Box sx={{
            width: STAGE_NATURAL.w,
            height: STAGE_NATURAL.h,
          transform: `scale(${fitScale})`,
          transformOrigin: 'center center',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Playfield */}
          <Box sx={{
            position: 'relative',
            width: PLAYFIELD_W_PX,
            height: PLAYFIELD_H_PX,
            background: '#FFFFFF',
            borderRadius: '12px 12px 0 0',
            borderTop: '1px solid #E8EDF2',
            borderLeft: '1px solid #E8EDF2',
            borderRight: '1px solid #E8EDF2',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {/* Slow-mo blue tint sits behind everything */}
            {slowMoActive && (
              <Box sx={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(180deg, rgba(63,134,224,0.08), rgba(63,134,224,0.02))',
                zIndex: 1,
              }} />
            )}

            {/* Column trails — faint vertical hints behind every column
                with a falling waste item, so trajectory is readable. */}
            {Array.from(new Set(items.filter(i => i.kind === 'waste').map(i => i.col))).map(col => (
              <Box key={`trail-${col}`} sx={{
                position: 'absolute',
                left: col * CELL_W, top: 0,
                width: CELL_W, height: '100%',
                background: 'linear-gradient(180deg, rgba(255,140,66,0) 0%, rgba(255,140,66,0.04) 60%, rgba(255,140,66,0.10) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }} />
            ))}

            <AnimatePresence>
              {items.map(item => {
                const isSelected = item.kind === 'waste' && selectedItemId === item.id;
                const isActive = activeWasteItem?.id === item.id;
                const isPower = item.kind === 'powerup';
                const emoji = isPower ? item.power.emoji : item.waste.emoji;
                const title = isPower ? `${item.power.name} — ${item.power.desc}` : item.waste.name;
                const left = item.col * CELL_W + (CELL_W - ITEM_SIZE) / 2;
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, scale: 0.5, left }}
                    animate={{
                      opacity: 1,
                      scale: isPower ? [1, 1.08, 1] : 1,
                      left,
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      scale: isPower ? { repeat: Infinity, duration: 1.2 } : { duration: 0.15 },
                      left: { duration: 0.22, ease: 'easeOut' },
                    }}
                    style={{
                      position: 'absolute',
                      top: item.row * CELL_H,
                      width: ITEM_SIZE, height: ITEM_SIZE,
                      zIndex: 2,
                    }}
                  >
                    <Box
                      onClick={() => handleItemClick(item)}
                      sx={{
                        width: '100%', height: '100%',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 38, cursor: 'pointer',
                        background: isPower
                          ? 'radial-gradient(circle, #9C27B030, #9C27B008 70%)'
                          : isSelected
                            ? 'linear-gradient(180deg, #FFF5EE, #FFE9DA)'
                            : 'linear-gradient(180deg, #FFFFFF, #F2F4F8)',
                        border: isPower
                          ? '2px solid #9C27B0'
                          : isSelected
                            ? '2px solid #FF8C42'
                            : isActive
                              ? '2px solid #FF8C4280'
                              : '2px solid rgba(26, 35, 50, 0.10)',
                        boxShadow: isPower
                          ? '0 0 14px rgba(156,39,176,0.45)'
                          : isSelected
                            ? '0 6px 14px rgba(255,140,66,0.30)'
                            : '0 4px 10px rgba(0,0,0,0.10), inset 0 -2px 0 rgba(0,0,0,0.04)',
                        transition: 'all 0.15s',
                        '&:hover': {
                          transform: 'scale(1.08)',
                          boxShadow: isPower
                            ? '0 0 18px rgba(156,39,176,0.6)'
                            : '0 8px 16px rgba(0,0,0,0.16)',
                        },
                      }}
                      title={title}
                    >
                      {emoji}
                    </Box>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Floating "+15 ×1.5" score popups */}
            <AnimatePresence>
              {floats.map(f => (
                <motion.div key={f.id}
                  initial={{ opacity: 0, y: 0, scale: 0.7 }}
                  animate={{ opacity: 1, y: -34, scale: 1 }}
                  exit={{ opacity: 0, y: -56 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: f.col * CELL_W + (CELL_W - ITEM_SIZE) / 2,
                    top: f.row * CELL_H,
                    width: ITEM_SIZE,
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

          {/* Bin tray — exactly aligned to the 5 lanes above. The lane
              under the active item is highlighted so the player can see
              where the item will land if untouched. */}
          <Box sx={{
            position: 'relative',
            width: PLAYFIELD_W_PX,
            height: BIN_TRAY_H,
            display: 'grid',
            gridTemplateColumns: `repeat(${PLAYFIELD_W}, 1fr)`,
            background: 'linear-gradient(180deg, #F5F7FA, #E2E7EE)',
            border: '1px solid #E8EDF2',
            borderTop: '2px solid #D4DBE5',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
          }}>
            {BINS.map((bin, idx) => {
              const isActiveLane = activeCol === idx;
              return (
                <Box
                  key={bin.id}
                  onClick={() => handleBinClick(idx)}
                  sx={{
                    position: 'relative',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    borderLeft: idx === 0 ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    background: isActiveLane
                      ? `linear-gradient(180deg, ${bin.color}30, ${bin.color}12)`
                      : 'transparent',
                    transition: 'background 0.18s',
                    '&:hover': { background: `linear-gradient(180deg, ${bin.color}30, ${bin.color}12)` },
                  }}
                >
                  <Box sx={{
                    position: 'absolute', top: 4, left: 4,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#1A2332', color: '#FFFFFF',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                  }}>
                    {idx + 1}
                  </Box>
                  <Typography sx={{ fontSize: 30, lineHeight: 1 }}>{bin.emoji}</Typography>
                  <Typography sx={{
                    fontSize: 12, fontWeight: 700, color: bin.color,
                    mt: 0.5, letterSpacing: '0.02em', textAlign: 'center', px: 0.4,
                  }}>
                    {bin.name}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
        </Box>

        {/* Right panel — cumulative "Did you know?" list. New facts are
            added to the top each time the player hits a 5-streak or
            mis-sorts; older facts stay below for the player to read at
            their own pace. Dedup'd by item type so each entry teaches
            once. */}
        <Box sx={{
          flex: '0 0 auto',
          width: 'clamp(180px, 22cqw, 280px)',
          minWidth: 0,
          display: 'flex', flexDirection: 'column',
          pt: 1,
          gap: 1,
          minHeight: 0,
        }}>
          <Typography sx={{ fontSize: 11, color: '#8892B0', letterSpacing: '0.12em', fontWeight: 700, flexShrink: 0 }}>
            DID YOU KNOW?
          </Typography>
          <Box sx={{
            flex: 1, minHeight: 0,
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 0.8,
            pr: 0.4,
          }}>
            {unlockedFacts.length === 0 ? (
              <Box sx={{
                borderRadius: 2,
                background: '#FFFFFF',
                border: '1px dashed #D4DBE5',
                p: 1.6,
                textAlign: 'center',
              }}>
                <Typography sx={{ fontSize: 11, color: '#8892B0', lineHeight: 1.5, fontStyle: 'italic' }}>
                  Sort 5 in a row to unlock your first fact — or learn from a miss.
                </Typography>
              </Box>
            ) : (
              <AnimatePresence initial={false}>
                {unlockedFacts.map(f => (
                  <motion.div
                    key={f.type}
                    layout
                    initial={{ opacity: 0, x: 16, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  >
                    <Box sx={{
                      borderRadius: 2,
                      background: '#FFFFFF',
                      borderLeft: `3px solid ${f.bin.color}`,
                      border: '1px solid #E8EDF2',
                      borderLeftWidth: 3,
                      p: 1.2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.6,
                        mb: 0.5,
                      }}>
                        <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }}>{f.emoji}</Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#1A2332', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.name}
                        </Typography>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: f.bin.color, letterSpacing: '0.02em' }}>
                          {f.bin.emoji}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: '#5A6A7E', lineHeight: 1.45 }}>
                        {f.text}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { GRID_SIZE, getTechForValue, TECH_PROGRESSION } from './data';
import EcoButton from '../../components/EcoButton';

type Grid = (number | null)[][];
type Direction = 'up' | 'down' | 'left' | 'right';
type Screen = 'intro' | 'playing' | 'gameover';

function createEmpty(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array<null>(GRID_SIZE).fill(null));
}

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

function addRandom(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!grid[r][c]) empty.push([r, c]);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = cloneGrid(grid);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slideRow(row: (number | null)[]): { result: (number | null)[]; score: number; moved: boolean } {
  const tiles = row.filter((v): v is number => v !== null);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      merged.push(tiles[i] * 2);
      score += tiles[i] * 2;
      i += 2;
    } else {
      merged.push(tiles[i]);
      i++;
    }
  }
  const result: (number | null)[] = Array(GRID_SIZE).fill(null);
  for (let j = 0; j < merged.length; j++) result[j] = merged[j];
  const moved = row.some((v, idx) => v !== result[idx]);
  return { result, score, moved };
}

function moveGrid(grid: Grid, direction: Direction): { grid: Grid; score: number; moved: boolean } {
  let totalScore = 0;
  let anyMoved = false;
  const newGrid = createEmpty();

  for (let i = 0; i < GRID_SIZE; i++) {
    let line: (number | null)[];
    switch (direction) {
      case 'left': line = grid[i].slice(); break;
      case 'right': line = grid[i].slice().reverse(); break;
      case 'up': line = Array.from({ length: GRID_SIZE }, (_, c) => grid[c][i]); break;
      case 'down': line = Array.from({ length: GRID_SIZE }, (_, c) => grid[GRID_SIZE - 1 - c][i]); break;
    }
    const { result, score, moved } = slideRow(line);
    totalScore += score;
    if (moved) anyMoved = true;
    switch (direction) {
      case 'left': for (let j = 0; j < GRID_SIZE; j++) newGrid[i][j] = result[j]; break;
      case 'right': for (let j = 0; j < GRID_SIZE; j++) newGrid[i][GRID_SIZE - 1 - j] = result[j]; break;
      case 'up': for (let j = 0; j < GRID_SIZE; j++) newGrid[j][i] = result[j]; break;
      case 'down': for (let j = 0; j < GRID_SIZE; j++) newGrid[GRID_SIZE - 1 - j][i] = result[j]; break;
    }
  }
  return { grid: newGrid, score: totalScore, moved: anyMoved };
}

function canMove(grid: Grid): boolean {
  for (const dir of ['left', 'up', 'right', 'down'] as Direction[]) {
    if (moveGrid(grid, dir).moved) return true;
  }
  return false;
}

function hasWon(grid: Grid): boolean {
  for (const row of grid) for (const val of row) if (val && val >= 2048) return true;
  return false;
}

let tileId = 0;

export default function Climate2048Game() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [grid, setGrid] = useState<Grid>(createEmpty());
  const [score, setScore] = useState(0);
  const [bestTile, setBestTile] = useState(2);
  const [won, setWon] = useState(false);

  const startGame = useCallback(() => {
    let g = createEmpty();
    g = addRandom(g); g = addRandom(g);
    setGrid(g); setScore(0); setBestTile(2); setWon(false); tileId = 0;
    setScreen('playing');
  }, []);

  const handleMove = useCallback((direction: Direction) => {
    const result = moveGrid(grid, direction);
    if (!result.moved) return;
    const newGrid = addRandom(result.grid);
    setGrid(newGrid); setScore(s => s + result.score);
    let max = 2;
    for (const row of newGrid) for (const val of row) if (val && val > max) max = val;
    setBestTile(max);
    if (hasWon(newGrid) && !won) setWon(true);
    if (!canMove(newGrid)) setTimeout(() => setScreen('gameover'), 500);
  }, [grid, won]);

  useEffect(() => {
    if (screen !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); handleMove(dir); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, handleMove]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) { handleMove(dx > 0 ? 'right' : 'left'); }
    else { handleMove(dy > 0 ? 'down' : 'up'); }
    touchStart.current = null;
  }, [handleMove]);

  // --- Intro ---
  if (screen === 'intro') {
    const progression = Object.entries(TECH_PROGRESSION).slice(0, 8);
    return (
      <Box sx={{
        height: '100vh', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        px: 3, py: 4, overflow: 'hidden',
      }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h3" sx={{
            background: 'linear-gradient(135deg, #FF6B35, #8BC53F)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, mb: 2,
          }} align="center">
            🔢 Climate 2048
          </Typography>
          <Typography variant="h6" sx={{ color: '#5A6A7E', mb: 4 }} align="center">
            Merge your way to Net Zero. Upgrade technologies from LED bulbs to smart cities!
          </Typography>
        </motion.div>

        <Box sx={{ maxWidth: 500, mb: 3 }}>
          <Typography sx={{ mb: 2, color: '#1A2332' }} align="center">Tech progression path:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
            {progression.map(([val, tech]) => (
              <Box key={val} sx={{
                px: 1, py: 0.5, borderRadius: 1,
                background: `${tech.color}10`, border: `1px solid ${tech.color}25`,
                fontSize: 12, display: 'flex', alignItems: 'center', gap: 0.5,
              }}>
                {tech.emoji} {tech.name}
              </Box>
            ))}
            <Box sx={{ px: 1, py: 0.5, borderRadius: 1, background: '#8BC53F15', border: '1px solid #8BC53F25', fontSize: 12, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              🌍 Net Zero!
            </Box>
          </Box>
        </Box>

        <Typography sx={{ color: '#5A6A7E', mb: 3, maxWidth: 400, textAlign: 'center' }}>
          Swipe or use arrow keys to slide tiles. Matching tiles merge and upgrade!
          Reach 2048 (Smart City) to win. Keep going for Net Zero!
        </Typography>

        <EcoButton onClick={startGame} size="large">Start Building 🔢</EcoButton>
      </Box>
    );
  }

  // --- Game Over ---
  if (screen === 'gameover') {
    const tech = getTechForValue(bestTile);
    return (
      <Box sx={{
        height: '100vh', bgcolor: '#FAFBFC', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 3,
        overflow: 'hidden',
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }} align="center">
            {won ? '🎉 Net Zero Achieved!' : 'Game Over'}
          </Typography>
          <Typography variant="h5" sx={{ color: '#FF6B35', mb: 1 }} align="center">
            Score: {score.toLocaleString()}
          </Typography>
          <Typography sx={{ color: tech.color, mb: 3 }} align="center">
            Best tech: {tech.emoji} {tech.name}
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
  const tiles = grid.flatMap((row, r) =>
    row.map((value, c) => value ? { id: tileId++, value, row: r, col: c } : null)
      .filter(Boolean) as { id: number; value: number; row: number; col: number }[]
  );

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        height: '100vh', bgcolor: '#F0F3F7', color: '#1A2332',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        py: 8, px: 2, touchAction: 'none', userSelect: 'none', overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, color: '#8892B0' }}>SCORE</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#FF6B35' }}>{score.toLocaleString()}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, color: '#8892B0' }}>BEST TECH</Typography>
          <Typography sx={{ fontWeight: 800, color: getTechForValue(bestTile).color }}>
            {getTechForValue(bestTile).emoji} {getTechForValue(bestTile).name}
          </Typography>
        </Box>
      </Box>

      {won && (
        <Box sx={{ mb: 2, px: 3, py: 1, borderRadius: 2, background: '#8BC53F12', border: '1px solid #8BC53F25' }}>
          <Typography sx={{ color: '#8BC53F', fontWeight: 700 }}>🎉 Smart City achieved! Keep going to Net Zero!</Typography>
        </Box>
      )}

      <Box sx={{
        position: 'relative', width: GRID_SIZE * 90 + 16, height: GRID_SIZE * 90 + 16,
        background: '#FFFFFF', borderRadius: 3, p: 1,
        border: '1px solid #E8EDF2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {Array.from({ length: GRID_SIZE }).map((_, r) =>
          Array.from({ length: GRID_SIZE }).map((_, c) => (
            <Box key={`empty-${r}-${c}`} sx={{
              position: 'absolute', left: c * 90 + 8, top: r * 90 + 8,
              width: 82, height: 82, borderRadius: 2, background: '#F0F3F7',
            }} />
          ))
        )}

        {tiles.map(tile => {
          const tech = getTechForValue(tile.value);
          return (
            <motion.div key={`${tile.row}-${tile.col}`} layout transition={{ duration: 0.15 }}>
              <Box sx={{
                position: 'absolute', left: tile.col * 90 + 8, top: tile.row * 90 + 8,
                width: 82, height: 82, borderRadius: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${tech.color}18, ${tech.color}08)`,
                border: `1px solid ${tech.color}35`,
                boxShadow: `0 1px 4px ${tech.color}15`,
              }}>
                <Typography sx={{ fontSize: 28, lineHeight: 1 }}>{tech.emoji}</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: tech.color, mt: 0.3 }}>
                  {tile.value >= 2048 ? tile.value : tech.name}
                </Typography>
              </Box>
            </motion.div>
          );
        })}
      </Box>

      <Typography sx={{ mt: 2, color: '#8892B0', fontSize: 12 }}>
        Arrow keys / WASD / Swipe to move
      </Typography>
    </Box>
  );
}

// Pure 2048 engine. Tiles carry stable IDs across moves so framer-motion
// `layoutId` can animate slides and merges naturally.

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

export interface BoardState {
  size: number;
  tiles: Tile[];
  score: number;
  best: number;
  won: boolean;
  over: boolean;
  keepGoing: boolean;
}

export type IdGen = () => number;

export function makeIdGen(): IdGen {
  let n = 1;
  return () => n++;
}

export function emptyBoard(size: number): BoardState {
  return { size, tiles: [], score: 0, best: 0, won: false, over: false, keepGoing: false };
}

export function withRandomTile(state: BoardState, idGen: IdGen): BoardState {
  const occupied = new Set(state.tiles.map(t => t.row * state.size + t.col));
  const free: number[] = [];
  for (let i = 0; i < state.size * state.size; i++) if (!occupied.has(i)) free.push(i);
  if (free.length === 0) return state;
  const cell = free[Math.floor(Math.random() * free.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const tile: Tile = {
    id: idGen(),
    value,
    row: Math.floor(cell / state.size),
    col: cell % state.size,
    isNew: true,
  };
  return { ...state, tiles: [...state.tiles, tile] };
}

export function startBoard(size: number, idGen: IdGen): BoardState {
  let s = emptyBoard(size);
  s = withRandomTile(s, idGen);
  s = withRandomTile(s, idGen);
  return s;
}

interface LineResult {
  tiles: Tile[]; // tiles in their new line order, value updated, merged flag set
  scoreDelta: number;
}

function slideLine(line: Tile[]): LineResult {
  const out: Tile[] = [];
  let scoreDelta = 0;
  let i = 0;
  while (i < line.length) {
    const cur = line[i];
    if (i + 1 < line.length && line[i + 1].value === cur.value) {
      // merge: keep cur's id, double the value, drop the partner
      out.push({ ...cur, value: cur.value * 2, isMerged: true, isNew: false });
      scoreDelta += cur.value * 2;
      i += 2;
    } else {
      out.push({ ...cur, isMerged: false, isNew: false });
      i += 1;
    }
  }
  return { tiles: out, scoreDelta };
}

export function move(
  state: BoardState,
  dir: Direction,
): { state: BoardState; moved: boolean; scoreDelta: number } {
  const { size } = state;
  const grid: (Tile | null)[][] = Array.from({ length: size }, () =>
    Array<Tile | null>(size).fill(null),
  );
  for (const t of state.tiles) grid[t.row][t.col] = t;

  const next: Tile[] = [];
  let scoreDelta = 0;
  let moved = false;

  for (let line = 0; line < size; line++) {
    let lineTiles: Tile[];
    if (dir === 'left') {
      lineTiles = grid[line].filter((t): t is Tile => t !== null);
    } else if (dir === 'right') {
      lineTiles = grid[line].slice().reverse().filter((t): t is Tile => t !== null);
    } else if (dir === 'up') {
      lineTiles = [];
      for (let r = 0; r < size; r++) {
        const t = grid[r][line];
        if (t) lineTiles.push(t);
      }
    } else {
      lineTiles = [];
      for (let r = size - 1; r >= 0; r--) {
        const t = grid[r][line];
        if (t) lineTiles.push(t);
      }
    }

    const before = lineTiles.length;
    const { tiles: kept, scoreDelta: sd } = slideLine(lineTiles);
    scoreDelta += sd;
    if (kept.length !== before) moved = true;

    for (let k = 0; k < kept.length; k++) {
      let row: number;
      let col: number;
      if (dir === 'left') {
        row = line; col = k;
      } else if (dir === 'right') {
        row = line; col = size - 1 - k;
      } else if (dir === 'up') {
        row = k; col = line;
      } else {
        row = size - 1 - k; col = line;
      }
      if (kept[k].row !== row || kept[k].col !== col) moved = true;
      next.push({ ...kept[k], row, col });
    }
  }

  const score = state.score + scoreDelta;
  const newState: BoardState = {
    ...state,
    tiles: next,
    score,
    best: Math.max(state.best, score),
  };
  return { state: newState, moved, scoreDelta };
}

export function canMove(state: BoardState): boolean {
  if (state.tiles.length < state.size * state.size) return true;
  for (const dir of ['left', 'right', 'up', 'down'] as Direction[]) {
    if (move(state, dir).moved) return true;
  }
  return false;
}

export function highestValue(state: BoardState): number {
  let m = 0;
  for (const t of state.tiles) if (t.value > m) m = t.value;
  return m;
}

export function applyMove(
  state: BoardState,
  dir: Direction,
  idGen: IdGen,
  winThreshold = 4096,
): { state: BoardState; moved: boolean; scoreDelta: number; reachedWin: boolean } {
  const result = move(state, dir);
  if (!result.moved) return { ...result, reachedWin: false };
  const spawned = withRandomTile(result.state, idGen);
  const reachedWin = !state.won && highestValue(spawned) >= winThreshold;
  const won = state.won || reachedWin;
  const over = !canMove(spawned);
  return {
    state: { ...spawned, won, over },
    moved: true,
    scoreDelta: result.scoreDelta,
    reachedWin,
  };
}

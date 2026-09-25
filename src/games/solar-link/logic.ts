import type { Rng } from '../../core/random';

export type Level = 'easy' | 'medium' | 'hard';

/** Grid side length per level. 6×6 still gives 44px+ tiles on a 320px-wide phone. */
export const LEVEL_SIZE: Record<Level, number> = { easy: 4, medium: 5, hard: 6 };

export const LEVEL_LABEL: Record<Level, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

// Cable ends are a 4-bit mask, one bit per side, in clockwise order.
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;
export const DIRS = [N, E, S, W] as const;

/** The side facing `dir` on the neighbouring tile (N ↔ S, E ↔ W). */
export function opposite(dir: number): number {
  return rotateMask(dir, 2);
}

/** Turns a mask clockwise by `turns` quarter turns (N → E → S → W → N). */
export function rotateMask(mask: number, turns = 1): number {
  const t = ((turns % 4) + 4) % 4;
  return ((mask << t) | (mask >> (4 - t))) & 0b1111;
}

/** Distinct orientations of a shape: 1 for a cross, 2 for a straight, otherwise 4. */
export function orientations(mask: number): number {
  for (let k = 1; k < 4; k++) if (rotateMask(mask, k) === mask) return k;
  return 4;
}

export type CableShape = 'end' | 'straight' | 'corner' | 'tee' | 'cross';

export function cableShape(mask: number): CableShape {
  const ends = DIRS.filter((d) => mask & d).length;
  if (ends <= 1) return 'end';
  if (ends === 3) return 'tee';
  if (ends === 4) return 'cross';
  return mask === (N | S) || mask === (E | W) ? 'straight' : 'corner';
}

export type TileKind = 'source' | 'home' | 'cable';

export interface Tile {
  kind: TileKind;
  /** Cable ends in the generated solution. */
  shape: number;
  /** Cable ends as the tile is turned right now. */
  mask: number;
}

export interface Board {
  size: number;
  /** Row-major, `size * size` tiles. */
  tiles: Tile[];
  /** Index of the solar farm. */
  source: number;
}

/** Index of the neighbour on side `dir`, or -1 at the edge of the grid. */
export function neighbour(size: number, index: number, dir: number): number {
  const row = Math.floor(index / size);
  const col = index % size;
  if (dir === N) return row > 0 ? index - size : -1;
  if (dir === S) return row < size - 1 ? index + size : -1;
  if (dir === E) return col < size - 1 ? index + 1 : -1;
  return col > 0 ? index - 1 : -1;
}

/** Quarter turns clockwise still needed to put a tile back in its solved position. */
export function turnsToSolve(tile: Tile): number {
  for (let k = 0; k < 4; k++) if (rotateMask(tile.mask, k) === tile.shape) return k;
  return 0;
}

/** Fewest clockwise turns that solve the board as dealt (symmetric shapes need fewer). */
export function parFor(board: Board): number {
  return board.tiles.reduce((sum, t) => sum + turnsToSolve(t), 0);
}

/**
 * The tiles connected to the solar farm. Power passes between neighbours only when
 * both tiles have a cable end on the side they share.
 */
export function poweredCells(board: Board): Set<number> {
  const powered = new Set([board.source]);
  const queue = [board.source];
  while (queue.length > 0) {
    const i = queue.pop()!;
    const mask = board.tiles[i]!.mask;
    for (const d of DIRS) {
      if (!(mask & d)) continue;
      const j = neighbour(board.size, i, d);
      if (j < 0 || powered.has(j) || !(board.tiles[j]!.mask & opposite(d))) continue;
      powered.add(j);
      queue.push(j);
    }
  }
  return powered;
}

export function homeCells(board: Board): number[] {
  return board.tiles.flatMap((t, i) => (t.kind === 'home' ? [i] : []));
}

export function isSolved(board: Board, powered = poweredCells(board)): boolean {
  return homeCells(board).every((i) => powered.has(i));
}

/** Share of turnable tiles (everything but crosses) that start out of place. */
export function scrambledShare(board: Board): number {
  const turnable = board.tiles.filter((t) => orientations(t.shape) > 1);
  if (turnable.length === 0) return 0;
  return turnable.filter((t) => turnsToSolve(t) > 0).length / turnable.length;
}

/** A dealt puzzle must have at least this share of turnable tiles out of place. */
export const MIN_SCRAMBLE = 0.6;

/** Every puzzle has at least this many homes to power. */
export const MIN_HOMES = 2;

/** At most this share of tiles are homes, so most of the board is cable to work out. */
export const MAX_HOME_SHARE = 0.3;

/**
 * Grows a random spanning tree over the whole grid from the solar farm, so every tile
 * carries cable and there is exactly one path to each home. Mixing "newest" and "random"
 * picks (a growing-tree maze) gives long winding cables with a few branches.
 */
function spanningTree(size: number, source: number, rng: Rng): number[] {
  const masks = Array.from({ length: size * size }, () => 0);
  const visited = new Set([source]);
  const active = [source];
  while (active.length > 0) {
    const at = rng() < 0.75 ? active.length - 1 : Math.floor(rng() * active.length);
    const cell = active[at]!;
    const open = DIRS.filter((d) => {
      const j = neighbour(size, cell, d);
      return j >= 0 && !visited.has(j);
    });
    if (open.length === 0) {
      active.splice(at, 1);
      continue;
    }
    const dir = open[Math.floor(rng() * open.length)]!;
    const next = neighbour(size, cell, dir);
    masks[cell]! |= dir;
    masks[next]! |= opposite(dir);
    visited.add(next);
    active.push(next);
  }
  return masks;
}

/**
 * Deals a solvable puzzle: a spanning tree from a solar farm near the centre, a home on
 * every other dead end, and every tile turned at random until enough are out of place.
 */
export function generatePuzzle(size: number, rng: Rng): Board {
  const mid = Math.floor((size - 1) / 2);
  // Even grids have four centre cells; pick one of them.
  const spread = size % 2 === 0 ? 2 : 1;
  const source = (mid + Math.floor(rng() * spread)) * size + (mid + Math.floor(rng() * spread));

  let masks = spanningTree(size, source, rng);
  const isHome = (m: number, i: number) => i !== source && cableShape(m) === 'end';
  const maxHomes = Math.floor(size * size * MAX_HOME_SHARE);
  const homes = () => masks.filter(isHome).length;
  while (homes() < MIN_HOMES || homes() > maxHomes) masks = spanningTree(size, source, rng);

  const tiles: Tile[] = masks.map((shape, i) => ({
    kind: i === source ? 'source' : isHome(shape, i) ? 'home' : 'cable',
    shape,
    mask: shape,
  }));
  const board: Board = { size, tiles, source };
  do {
    for (const t of tiles) t.mask = rotateMask(t.shape, Math.floor(rng() * 4));
  } while (scrambledShare(board) < MIN_SCRAMBLE || isSolved(board));
  return board;
}

export type TurnOutcome =
  | { kind: 'ignored' }
  | {
      kind: 'turned';
      /** Homes that gained power with this turn. */
      newlyPowered: number[];
      poweredHomes: number;
      solved: boolean;
    };

/** Pure game state for Solar Link. The view calls `turn` and renders `board`. */
export class SolarGame {
  readonly board: Board;
  readonly par: number;
  readonly totalHomes: number;
  turns = 0;
  powered: Set<number>;

  constructor(board: Board) {
    this.board = board;
    this.par = parFor(board);
    this.totalHomes = homeCells(board).length;
    this.powered = poweredCells(board);
  }

  get poweredHomes(): number {
    return homeCells(this.board).filter((i) => this.powered.has(i)).length;
  }

  get solved(): boolean {
    return isSolved(this.board, this.powered);
  }

  /** Turns tile `index` a quarter turn clockwise. */
  turn(index: number): TurnOutcome {
    const tile = this.board.tiles[index];
    if (!tile || this.solved) return { kind: 'ignored' };
    const before = this.powered;
    tile.mask = rotateMask(tile.mask);
    this.turns++;
    this.powered = poweredCells(this.board);
    const newlyPowered = homeCells(this.board).filter((i) => this.powered.has(i) && !before.has(i));
    return {
      kind: 'turned',
      newlyPowered,
      poweredHomes: this.poweredHomes,
      solved: this.solved,
    };
  }
}

/** 3 stars at or under par, 2 within half as many turns again, 1 for finishing. */
export function solarStars(par: number, turns: number): number {
  if (turns <= par) return 3;
  if (turns <= Math.ceil(par * 1.5)) return 2;
  return 1;
}

/** Rewards bigger grids, turning no more than needed and solving quickly. */
export function solarScore(size: number, par: number, turns: number, seconds: number): number {
  const cells = size * size;
  const accuracy = par / Math.max(turns, par, 1);
  const speedBonus = Math.max(0, cells * 4 - seconds) * 3;
  return Math.round(cells * 25 * accuracy + speedBonus);
}

/**
 * Picks `count` items starting at `start`, wrapping around, so each play can show the
 * next few facts. Returns the picked items and where the next pick should start.
 */
export function nextItems<T>(
  items: readonly T[],
  start: number,
  count: number,
): { picked: T[]; next: number } {
  if (items.length === 0) return { picked: [], next: 0 };
  const from = ((Math.floor(start) % items.length) + items.length) % items.length;
  const n = Math.min(count, items.length);
  const picked = Array.from({ length: n }, (_, k) => items[(from + k) % items.length] as T);
  return { picked, next: (from + n) % items.length };
}

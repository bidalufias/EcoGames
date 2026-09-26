import type { Rng } from '../../core/random';

// Grow the Forest rules: a sliding merge puzzle. Tiles slide as far as they can in the
// chosen direction; two tiles of the same stage that meet grow into the next stage.
// After every move that changes the board, a new seed appears.

export type Level = 'easy' | 'normal';
export type Dir = 'up' | 'down' | 'left' | 'right';

export const LEVEL_SIZE: Record<Level, number> = { easy: 5, normal: 4 };
export const LEVEL_LABEL: Record<Level, string> = { easy: 'Big garden', normal: 'Classic' };

/** The top stage: growing it wins the game. */
export const MAX_STAGE = 11;
/** Chance that a new tile is a seedling instead of a seed. */
const SEEDLING_CHANCE = 0.1;

export interface Tile {
  id: number;
  stage: number;
  row: number;
  col: number;
}

/** Points for growing a tile of this stage: 4 for a seedling, doubling each stage. */
export function stagePoints(stage: number): number {
  return 2 ** stage;
}

/** Stars from the best stage grown. The big board needs one stage more for each star. */
export function forestStars(highest: number, level: Level): number {
  const extra = level === 'easy' ? 1 : 0;
  if (highest >= 9 + extra) return 3;
  if (highest >= 8 + extra) return 2;
  if (highest >= 6 + extra) return 1;
  return 0;
}

export interface MoveResult {
  moved: boolean;
  /** Tiles that slid (by id) to a new cell. */
  slid: Tile[];
  /** New tiles made by merging two others, which slide into the new tile's cell and go. */
  grown: { tile: Tile; from: [number, number] }[];
  /** The new seed or seedling, if the move changed the board. */
  spawned: Tile | null;
  points: number;
  /** Stages grown for the first time this game. */
  firsts: number[];
}

export class ForestBoard {
  readonly size: number;
  score = 0;
  moves = 0;
  /** The highest stage grown so far. */
  highest = 1;
  private cells: (Tile | null)[];
  private nextId = 1;
  private rng: Rng;
  private reached = new Set<number>();

  constructor(size: number, rng: Rng, start?: readonly (number | 0)[]) {
    this.size = size;
    this.rng = rng;
    this.cells = Array.from({ length: size * size }, () => null);
    if (start) {
      start.forEach((stage, i) => {
        if (stage > 0) this.cells[i] = this.make(stage, Math.floor(i / size), i % size);
      });
    } else {
      this.spawn();
      this.spawn();
    }
    for (const t of this.tiles) this.reach(t.stage);
  }

  get tiles(): Tile[] {
    return this.cells.filter((t): t is Tile => t !== null);
  }

  at(row: number, col: number): Tile | null {
    return this.cells[row * this.size + col] ?? null;
  }

  /** Stages as a flat list, 0 for an empty cell (row by row). */
  get stages(): number[] {
    return this.cells.map((t) => t?.stage ?? 0);
  }

  get won(): boolean {
    return this.highest >= MAX_STAGE;
  }

  /** True while some move would change the board. */
  canMove(): boolean {
    const n = this.size;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const t = this.at(r, c);
        if (!t) return true;
        if (c + 1 < n && this.at(r, c + 1)?.stage === t.stage) return true;
        if (r + 1 < n && this.at(r + 1, c)?.stage === t.stage) return true;
      }
    return false;
  }

  get over(): boolean {
    return this.won || !this.canMove();
  }

  move(dir: Dir): MoveResult {
    const n = this.size;
    const result: MoveResult = {
      moved: false,
      slid: [],
      grown: [],
      spawned: null,
      points: 0,
      firsts: [],
    };
    if (this.won) return result;
    const next: (Tile | null)[] = Array.from({ length: n * n }, () => null);
    for (let line = 0; line < n; line++) {
      // Cells of this line, starting from the edge the tiles slide towards.
      const cells = Array.from({ length: n }, (_, k) => {
        switch (dir) {
          case 'left':
            return { row: line, col: k };
          case 'right':
            return { row: line, col: n - 1 - k };
          case 'up':
            return { row: k, col: line };
          case 'down':
            return { row: n - 1 - k, col: line };
        }
      });
      const tiles = cells.map((c) => this.at(c.row, c.col)).filter((t): t is Tile => t !== null);
      let slot = 0;
      for (let i = 0; i < tiles.length; i++) {
        const a = tiles[i]!;
        const b = tiles[i + 1];
        const to = cells[slot]!;
        if (b && b.stage === a.stage && a.stage < MAX_STAGE) {
          const tile = this.make(a.stage + 1, to.row, to.col);
          result.grown.push({ tile, from: [a.id, b.id] });
          // The two old tiles slide into the cell, then the view swaps in the new one.
          a.row = b.row = to.row;
          a.col = b.col = to.col;
          next[to.row * n + to.col] = tile;
          result.points += stagePoints(tile.stage);
          if (this.reach(tile.stage)) result.firsts.push(tile.stage);
          result.moved = true;
          i++;
        } else {
          if (a.row !== to.row || a.col !== to.col) {
            a.row = to.row;
            a.col = to.col;
            result.slid.push(a);
            result.moved = true;
          }
          next[to.row * n + to.col] = a;
        }
        slot++;
      }
    }
    if (!result.moved) return result;
    this.cells = next;
    this.score += result.points;
    this.moves++;
    result.spawned = this.won ? null : this.spawn();
    return result;
  }

  private make(stage: number, row: number, col: number): Tile {
    return { id: this.nextId++, stage, row, col };
  }

  /** Marks a stage as grown; true the first time. */
  private reach(stage: number): boolean {
    this.highest = Math.max(this.highest, stage);
    if (this.reached.has(stage)) return false;
    this.reached.add(stage);
    return true;
  }

  private spawn(): Tile | null {
    const empty = this.cells.flatMap((t, i) => (t ? [] : [i]));
    if (empty.length === 0) return null;
    const i = empty[Math.floor(this.rng() * empty.length)]!;
    const stage = this.rng() < SEEDLING_CHANCE ? 2 : 1;
    const tile = this.make(stage, Math.floor(i / this.size), i % this.size);
    this.cells[i] = tile;
    this.reach(stage);
    return tile;
  }
}

import type { BinId, WasteItem } from '../../content/waste';
import { shuffle, type Rng } from '../../core/random';

export const START_LIVES = 3;
const BASE_POINTS = 10;

/** Streak multiplier: x1, then x2 after 3 in a row, x3 after 6, x4 after 10. */
export function multiplierFor(streak: number): number {
  if (streak >= 10) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

/** Fall speed as a fraction of the play-area height per second. Ramps up as you sort. */
export function fallSpeed(sorted: number): number {
  return Math.min(0.09 + sorted * 0.004, 0.24);
}

/** Milliseconds between new items. */
export function spawnInterval(sorted: number): number {
  return Math.max(1100, 2600 - sorted * 60);
}

/**
 * How many items may be falling at once. Phones cap this lower (`cap`) because
 * there is less room and fingers cover part of the screen.
 */
export function maxOnScreen(sorted: number, cap = 3): number {
  const n = sorted < 6 ? 1 : sorted < 18 ? 2 : 3;
  return Math.min(n, cap);
}

export function sorterStars(score: number): number {
  if (score >= 400) return 3;
  if (score >= 150) return 2;
  if (score > 0) return 1;
  return 0;
}

/** Deals items in shuffled rounds so every item appears before any repeats. */
export class ItemBag {
  private bag: WasteItem[] = [];
  private items: readonly WasteItem[];
  private rng: Rng;

  constructor(items: readonly WasteItem[], rng: Rng = Math.random) {
    this.items = items;
    this.rng = rng;
  }

  next(): WasteItem {
    if (this.bag.length === 0) this.bag = shuffle(this.items, this.rng);
    return this.bag.pop() as WasteItem;
  }
}

export interface SortOutcome {
  correct: boolean;
  points: number;
  multiplier: number;
  gameOver: boolean;
}

/** Score, lives and streak for one run of Waste Sorter. */
export class SorterState {
  score = 0;
  lives = START_LIVES;
  streak = 0;
  bestStreak = 0;
  sorted = 0;
  readonly mistakes: WasteItem[] = [];

  get gameOver(): boolean {
    return this.lives <= 0;
  }

  /** The player put `item` in `bin`. */
  sort(item: WasteItem, bin: BinId): SortOutcome {
    if (this.gameOver) return { correct: false, points: 0, multiplier: 1, gameOver: true };
    if (item.bin === bin) {
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.sorted++;
      const multiplier = multiplierFor(this.streak);
      const points = BASE_POINTS * multiplier;
      this.score += points;
      return { correct: true, points, multiplier, gameOver: false };
    }
    return this.fail(item);
  }

  /** The item reached the ground without being sorted. */
  miss(item: WasteItem): SortOutcome {
    if (this.gameOver) return { correct: false, points: 0, multiplier: 1, gameOver: true };
    return this.fail(item);
  }

  private fail(item: WasteItem): SortOutcome {
    this.streak = 0;
    this.lives--;
    if (!this.mistakes.some((m) => m.id === item.id)) this.mistakes.push(item);
    return { correct: false, points: 0, multiplier: 1, gameOver: this.gameOver };
  }
}

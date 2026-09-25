import { RIVER_FACTS, type RiverItem } from '../../content/river';
import { shuffle, type Rng } from '../../core/random';

export const START_LIVES = 3;
/** Length of the trip down to the river mouth. */
export const TRIP_MS = 60_000;
const BASE_POINTS = 10;
/** No animals in the first few seconds, so new players can learn to steer. */
const ANIMAL_FREE_MS = 3000;
/**
 * Minimum time between two animals. Animals never arrive side by side, so there is
 * always a gap wide enough for the boat.
 */
export const MIN_ANIMAL_GAP_MS = 900;
/** Consecutive items are at least this far apart across the river (0–1). */
export const MIN_SPREAD = 0.22;

/** Streak multiplier: x1, then x2 after 3 in a row, x3 after 6, x4 after 10. */
export function multiplierFor(streak: number): number {
  if (streak >= 10) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

/** How far through the trip we are, from 0 to 1. */
function progress(elapsedMs: number): number {
  return Math.min(Math.max(elapsedMs / TRIP_MS, 0), 1);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Flow speed as a fraction of the play-area height per second. The river speeds up
 * towards the sea; phones (`compact`) flow a little slower.
 */
export function flowSpeed(elapsedMs: number, compact = false): number {
  return lerp(0.17, 0.32, progress(elapsedMs)) * (compact ? 0.85 : 1);
}

/** Milliseconds between new items. */
export function spawnInterval(elapsedMs: number, compact = false): number {
  return Math.round(lerp(1300, 650, progress(elapsedMs)) * (compact ? 1.2 : 1));
}

/** Chance that a new item is an animal rather than rubbish. */
export function animalChance(elapsedMs: number): number {
  if (elapsedMs < ANIMAL_FREE_MS) return 0;
  return lerp(0.18, 0.4, progress(elapsedMs));
}

/** How many items may float at once. Phones have less room, so fewer. */
export function maxOnScreen(elapsedMs: number, compact = false): number {
  const n = Math.round(lerp(4, 7, progress(elapsedMs)));
  return compact ? n - 2 : n;
}

export function riverStars(score: number): number {
  if (score >= 600) return 3;
  if (score >= 200) return 2;
  if (score > 0) return 1;
  return 0;
}

export interface Spawn {
  item: RiverItem;
  /** Position across the water, from 0 (left bank) to 1 (right bank). */
  x: number;
}

/**
 * Chooses what floats down the river next and where. Items are dealt from shuffled
 * bags so every kind of rubbish and animal turns up, and positions are spread out so
 * items don't overlap and animals never form a wall.
 */
export class RiverSpawner {
  private rubbish: readonly RiverItem[];
  private animals: readonly RiverItem[];
  private rubbishBag: RiverItem[] = [];
  private animalBag: RiverItem[] = [];
  private rng: Rng;
  private lastX = -1;
  private lastAnimalAt = Number.NEGATIVE_INFINITY;

  constructor(items: readonly RiverItem[], rng: Rng = Math.random) {
    this.rubbish = items.filter((i) => i.kind === 'rubbish');
    this.animals = items.filter((i) => i.kind === 'animal');
    this.rng = rng;
  }

  next(elapsedMs: number): Spawn {
    const animal =
      this.animals.length > 0 &&
      elapsedMs - this.lastAnimalAt >= MIN_ANIMAL_GAP_MS &&
      this.rng() < animalChance(elapsedMs);
    let item: RiverItem;
    if (animal) {
      if (this.animalBag.length === 0) this.animalBag = shuffle(this.animals, this.rng);
      item = this.animalBag.pop() as RiverItem;
      this.lastAnimalAt = elapsedMs;
    } else {
      if (this.rubbishBag.length === 0) this.rubbishBag = shuffle(this.rubbish, this.rng);
      item = this.rubbishBag.pop() as RiverItem;
    }

    let x = this.rng();
    // Too close to the last item: step away from it, wrapping round to the other bank.
    if (this.lastX >= 0 && Math.abs(x - this.lastX) < MIN_SPREAD) {
      x = (x < this.lastX ? x - MIN_SPREAD : x + MIN_SPREAD) + 1;
      x %= 1;
    }
    this.lastX = x;
    return { item, x };
  }
}

export interface CatchOutcome {
  points: number;
  multiplier: number;
}

export interface BumpOutcome {
  /** True the first time this kind of animal is bumped in a run. */
  firstTime: boolean;
  gameOver: boolean;
}

/** Score, lives, streak and the trip clock for one run of River Rescue. */
export class RiverState {
  score = 0;
  lives = START_LIVES;
  streak = 0;
  bestStreak = 0;
  caught = 0;
  escaped = 0;
  elapsed = 0;
  readonly tripMs: number;
  /** Each kind of rubbish that escaped to the sea, in order. */
  readonly escapedItems: RiverItem[] = [];
  /** Each kind of animal bumped, in order. */
  readonly bumped: RiverItem[] = [];

  constructor(tripMs = TRIP_MS) {
    this.tripMs = tripMs;
  }

  get timeLeft(): number {
    return Math.max(0, this.tripMs - this.elapsed);
  }

  /** Whole seconds left, as shown in the HUD. */
  get secondsLeft(): number {
    return Math.ceil(this.timeLeft / 1000);
  }

  /** The boat reached the river mouth with lives to spare. */
  get finished(): boolean {
    return this.timeLeft <= 0 && this.lives > 0;
  }

  get gameOver(): boolean {
    return this.lives <= 0 || this.timeLeft <= 0;
  }

  /** Advances the trip clock. Returns true if this tick ended the run. */
  tick(dtMs: number): boolean {
    if (this.gameOver) return false;
    this.elapsed += Math.max(0, dtMs);
    return this.gameOver;
  }

  /** The boat scooped up a piece of rubbish. */
  catchRubbish(): CatchOutcome {
    if (this.gameOver) return { points: 0, multiplier: 1 };
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.caught++;
    const multiplier = multiplierFor(this.streak);
    const points = BASE_POINTS * multiplier;
    this.score += points;
    return { points, multiplier };
  }

  /** The boat bumped into an animal: lose a life and the streak. */
  bumpAnimal(item: RiverItem): BumpOutcome {
    if (this.gameOver) return { firstTime: false, gameOver: true };
    this.lives--;
    this.streak = 0;
    const firstTime = !this.bumped.some((b) => b.id === item.id);
    if (firstTime) this.bumped.push(item);
    return { firstTime, gameOver: this.gameOver };
  }

  /** Rubbish floated past the boat and out to sea: the streak breaks, no life lost. */
  escape(item: RiverItem): void {
    if (this.gameOver) return;
    this.streak = 0;
    this.escaped++;
    if (!this.escapedItems.some((e) => e.id === item.id)) this.escapedItems.push(item);
  }
}

/**
 * The results recap: facts about rubbish that escaped come first, then the animals
 * that were bumped, then general river facts, up to `max` lines.
 */
export function riverLearned(state: RiverState, max = 4): { term: string; detail: string }[] {
  return [
    ...state.escapedItems.map((i) => ({ term: i.name, detail: i.fact })),
    ...state.bumped.map((i) => ({ term: i.name, detail: i.fact })),
    ...RIVER_FACTS.map((f) => ({ term: f.term, detail: f.detail })),
  ].slice(0, max);
}

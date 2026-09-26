import {
  BEACH_RUBBISH,
  TURTLE_FACTS,
  type BeachThing,
  type TurtleFact,
} from '../../content/turtles';
import { shuffle, type Rng } from '../../core/random';

// Turtle Trek rules: guide sea turtle hatchlings, one at a time, from their nest at the
// top of the beach down to the sea. Ghost crabs scuttle across some rows and scare a
// hatchling back to the nest; rubbish blocks the way; lit beach lights pull hatchlings
// back up the beach until they are switched off. Waves sometimes wash up the wet sand
// and carry a hatchling out to sea.

export type Level = 'easy' | 'normal' | 'hard';
export type Dir = 'up' | 'down' | 'left' | 'right';
export type LaneKind = 'nest' | 'sand' | 'crabs' | 'rubbish' | 'wet' | 'sea';

export const COLS = 9;
/** Row 0 is the nest on the dunes, row ROWS - 1 is the sea. */
export const ROWS = 11;
export const NEST_COL = 4;
export const HATCHLINGS = 8;
export const TREK_MS = 100_000;
/** The player can take a step this often while a key is held. */
export const STEP_MS = 140;

export interface LevelConfig {
  /** Lane of each beach row (1 to ROWS - 3); the last two rows are wet sand and the sea. */
  lanes: LaneKind[];
  crabsPerLane: number;
  /** Crab speed in cells per second (a random value in this range). */
  crabSpeed: [number, number];
  /** How long a switched-off light stays off, in ms (a random value in this range). */
  lightOff: [number, number];
  /** Lights on at the start. */
  lightsOn: number;
}

export const LEVELS: Record<Level, LevelConfig> = {
  easy: {
    lanes: ['sand', 'crabs', 'rubbish', 'sand', 'crabs', 'sand', 'rubbish', 'sand'],
    crabsPerLane: 2,
    crabSpeed: [1.1, 1.6],
    lightOff: [14_000, 20_000],
    lightsOn: 1,
  },
  normal: {
    lanes: ['crabs', 'rubbish', 'sand', 'crabs', 'crabs', 'rubbish', 'sand', 'crabs'],
    crabsPerLane: 2,
    crabSpeed: [1.5, 2.2],
    lightOff: [10_000, 15_000],
    lightsOn: 1,
  },
  hard: {
    lanes: ['crabs', 'rubbish', 'crabs', 'crabs', 'rubbish', 'crabs', 'sand', 'crabs'],
    crabsPerLane: 3,
    crabSpeed: [1.9, 2.8],
    lightOff: [7_000, 11_000],
    lightsOn: 2,
  },
};

/** Where the beach lights stand: on the dunes, either side of the nest. */
export const LIGHT_COLS = [1, 7];
/** A lit light pulls a hatchling within this many cells (in both directions). */
export const LIGHT_REACH = 3;
/** How often a lit light pulls a hatchling one step towards it. */
export const PULL_MS = 850;
/** How often a wave washes up over the wet sand, and how long it stays. */
export const WAVE_EVERY = 5_000;
export const WAVE_MS = 1_200;
/** How close (in cells) a crab must be to catch a hatchling. */
const CRAB_REACH = 0.6;

export const SAVE_POINTS = 100;
/** Bonus for a hatchling that reaches the sea without a scare. */
export const CLEAN_BONUS = 50;
/** Points per second left, when every hatchling is safe before sunrise. */
export const TIME_POINTS = 5;

export interface Cell {
  row: number;
  col: number;
}

export interface Crab {
  row: number;
  /** Position across the beach in cells; wraps round. */
  x: number;
  /** Cells per second; negative moves left. */
  speed: number;
}

export interface Light {
  col: number;
  on: boolean;
  /** Ms until it is switched back on, while off. */
  offLeft: number;
}

export type TrekEvent =
  | { kind: 'saved'; clean: boolean; points: number; byWave: boolean }
  | { kind: 'scared' }
  | { kind: 'pulled'; light: Light }
  | { kind: 'light-on'; light: Light }
  | { kind: 'light-off'; light: Light }
  | { kind: 'blocked'; rubbish: BeachThing }
  | { kind: 'wave' }
  | { kind: 'end'; reason: 'all-safe' | 'sunrise' };

/** Stars from how many of the nest's hatchlings reached the sea. */
export function trekStars(saved: number, total = HATCHLINGS): number {
  if (saved >= total) return 3;
  if (saved >= Math.ceil(total * 0.6)) return 2;
  if (saved >= Math.ceil(total * 0.25)) return 1;
  return 0;
}

/** Facts for the results, starting from `start` so repeat players see new ones. */
export function trekFacts(start: number, count: number): { picked: TurtleFact[]; next: number } {
  const n = TURTLE_FACTS.length;
  const from = ((Math.floor(start) % n) + n) % n;
  const picked = Array.from(
    { length: Math.min(count, n) },
    (_, k) => TURTLE_FACTS[(from + k) % n]!,
  );
  return { picked, next: (from + picked.length) % n };
}

export class Trek {
  readonly level: Level;
  readonly config: LevelConfig;
  /** Lane kind of every row, from the nest (0) to the sea (ROWS - 1). */
  readonly lanes: LaneKind[];
  readonly crabs: Crab[] = [];
  /** Rubbish on the beach, by cell key "row,col". */
  readonly rubbish = new Map<string, BeachThing>();
  readonly lights: Light[];
  /** The hatchling crawling to the sea right now. */
  hatchling: Cell = { row: 0, col: NEST_COL };
  /** Hatchlings still in the nest, not counting the one on the beach. */
  waiting = HATCHLINGS - 1;
  saved = 0;
  scares = 0;
  score = 0;
  elapsed = 0;
  ended: 'all-safe' | 'sunrise' | null = null;
  /** The current hatchling has had no scare yet. */
  private clean = true;
  private pullIn = PULL_MS;
  private waveIn = WAVE_EVERY;
  /** Ms left of the wave that is up the beach, 0 when it isn't. */
  waveLeft = 0;
  private rng: Rng;
  private trekMs: number;

  constructor(level: Level, rng: Rng, opts: { trekMs?: number; calm?: boolean } = {}) {
    this.level = level;
    this.config = LEVELS[level];
    this.rng = rng;
    this.trekMs = opts.trekMs ?? TREK_MS;
    this.lanes = ['nest', ...this.config.lanes, 'wet', 'sea'];
    this.lanes.forEach((lane, row) => {
      if (lane === 'crabs' && !opts.calm) this.addCrabs(row);
      if (lane === 'rubbish') this.addRubbish(row);
    });
    const lit = shuffle(LIGHT_COLS, rng).slice(0, this.config.lightsOn);
    this.lights = LIGHT_COLS.map((col) => ({
      col,
      on: lit.includes(col),
      offLeft: lit.includes(col) ? 0 : this.offTime(),
    }));
  }

  get finished(): boolean {
    return this.ended !== null;
  }

  get timeLeft(): number {
    return Math.max(0, this.trekMs - this.elapsed);
  }

  /** Hatchlings not yet in the sea, including the one on the beach. */
  get left(): number {
    return HATCHLINGS - this.saved;
  }

  get waveUp(): boolean {
    return this.waveLeft > 0;
  }

  rubbishAt(cell: Cell): BeachThing | undefined {
    return this.rubbish.get(`${cell.row},${cell.col}`);
  }

  /** A lit light close enough to pull the hatchling. */
  pullingLight(): Light | undefined {
    const h = this.hatchling;
    return this.lights.find(
      (l) => l.on && Math.abs(l.col - h.col) <= LIGHT_REACH && h.row <= LIGHT_REACH,
    );
  }

  /** Takes one step. Returns what happened, if anything. */
  step(dir: Dir): TrekEvent[] {
    if (this.ended) return [];
    const h = this.hatchling;
    const next = {
      row: h.row + (dir === 'down' ? 1 : dir === 'up' ? -1 : 0),
      col: h.col + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0),
    };
    if (next.row < 0 || next.col < 0 || next.col >= COLS) return [];
    const junk = this.rubbishAt(next);
    if (junk) return [{ kind: 'blocked', rubbish: junk }];
    this.hatchling = next;
    const events: TrekEvent[] = [];
    this.arrive(events);
    return events;
  }

  /** Switches off a lit light, or the lit one nearest the hatchling. */
  switchOff(col?: number): Light | undefined {
    if (this.ended) return undefined;
    const lit = this.lights.filter((l) => l.on && (col === undefined || l.col === col));
    const light = lit.sort(
      (a, b) => Math.abs(a.col - this.hatchling.col) - Math.abs(b.col - this.hatchling.col),
    )[0];
    if (!light) return undefined;
    light.on = false;
    light.offLeft = this.offTime();
    return light;
  }

  tick(dt: number): TrekEvent[] {
    if (this.ended) return [];
    const step = Math.min(Math.max(dt, 0), this.timeLeft);
    const events: TrekEvent[] = [];
    this.elapsed += step;

    for (const c of this.crabs) {
      c.x += (c.speed * step) / 1000;
      if (c.x > COLS + 0.5) c.x -= COLS + 1;
      if (c.x < -1.5) c.x += COLS + 1;
    }
    for (const l of this.lights) {
      if (l.on) continue;
      l.offLeft -= step;
      if (l.offLeft <= 0) {
        l.on = true;
        events.push({ kind: 'light-on', light: l });
      }
    }
    // A lit light nearby tugs the hatchling towards it, back up the beach.
    const light = this.pullingLight();
    if (light) {
      this.pullIn -= step;
      if (this.pullIn <= 0) {
        this.pullIn = PULL_MS;
        const h = this.hatchling;
        const dir: Dir =
          h.row > 0 && (h.col === light.col || this.rng() < 0.5)
            ? 'up'
            : light.col < h.col
              ? 'left'
              : 'right';
        const before = { ...h };
        this.step(dir);
        if (before.row !== this.hatchling.row || before.col !== this.hatchling.col) {
          events.push({ kind: 'pulled', light });
        }
      }
    } else {
      this.pullIn = PULL_MS;
    }

    this.waveIn -= step;
    if (this.waveIn <= 0) {
      this.waveIn = WAVE_EVERY;
      this.waveLeft = WAVE_MS;
      events.push({ kind: 'wave' });
    }
    this.waveLeft = Math.max(0, this.waveLeft - step);
    this.arrive(events);
    if (this.elapsed >= this.trekMs && !this.ended) this.end('sunrise', events);
    return events;
  }

  /** Checks the hatchling's cell: the sea, a wave, or a crab. */
  private arrive(events: TrekEvent[]): void {
    if (this.ended) return;
    const h = this.hatchling;
    const sea = h.row >= ROWS - 1;
    const byWave = !sea && this.waveUp && this.lanes[h.row] === 'wet';
    if (sea || byWave) {
      const points = SAVE_POINTS + (this.clean ? CLEAN_BONUS : 0);
      this.saved++;
      this.score += points;
      events.push({ kind: 'saved', clean: this.clean, points, byWave });
      this.nextHatchling(events);
      return;
    }
    const caught = this.crabs.some((c) => c.row === h.row && Math.abs(c.x - h.col) < CRAB_REACH);
    if (caught) {
      this.scares++;
      this.clean = false;
      this.hatchling = { row: 0, col: NEST_COL };
      events.push({ kind: 'scared' });
    }
  }

  private nextHatchling(events: TrekEvent[]): void {
    this.clean = true;
    this.pullIn = PULL_MS;
    if (this.waiting > 0) {
      this.waiting--;
      this.hatchling = { row: 0, col: NEST_COL };
    } else {
      this.score += Math.floor(this.timeLeft / 1000) * TIME_POINTS;
      this.end('all-safe', events);
    }
  }

  private end(reason: 'all-safe' | 'sunrise', events: TrekEvent[]): void {
    this.ended = reason;
    events.push({ kind: 'end', reason });
  }

  private offTime(): number {
    const [min, max] = this.config.lightOff;
    return min + this.rng() * (max - min);
  }

  private addCrabs(row: number): void {
    const n = this.config.crabsPerLane;
    const [min, max] = this.config.crabSpeed;
    const speed = (min + this.rng() * (max - min)) * (this.rng() < 0.5 ? -1 : 1);
    const offset = this.rng() * COLS;
    for (let i = 0; i < n; i++) {
      this.crabs.push({ row, x: (offset + (i * (COLS + 1)) / n) % (COLS + 1), speed });
    }
  }

  /** Three or four pieces of rubbish, always leaving gaps to crawl through. */
  private addRubbish(row: number): void {
    const count = 3 + Math.floor(this.rng() * 2);
    const cols = shuffle(
      Array.from({ length: COLS }, (_, i) => i),
      this.rng,
    ).slice(0, count);
    for (const col of cols) {
      const item = BEACH_RUBBISH[Math.floor(this.rng() * BEACH_RUBBISH.length)]!;
      this.rubbish.set(`${row},${col}`, item);
    }
  }
}

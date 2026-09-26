import type { Rng } from '../../core/random';

// Mangrove Guard: waves roll in from the sea across a mudflat towards a village.
// Mangroves planted on the mudflat take the strength out of each wave that passes
// through them. Positions along a lane run from 0 (the village's edge) to COLS (the
// sea's edge); waves appear SEA cells further out.

export type Level = 'easy' | 'normal' | 'hard';
export type SpeciesId = 'api-api' | 'bakau';
export type WaveKind = 'ripple' | 'wave' | 'big' | 'storm';

export const LANES = 5;
export const COLS = 7;
/** Open sea beyond the mudflat, where waves appear, in cells. */
export const SEA = 1.5;
/** One house at the end of each lane. */
export const HOUSES = LANES;
export const START_SEEDLINGS = 6;
export const MAX_SEEDLINGS = 30;
/** The village nursery grows a seedling this often. */
export const INCOME_MS = 4000;
/** A grown mangrove drops a seedling (a propagule) this often. */
export const DROP_MS = 15_000;
/** A grown mangrove shelters a new young fish this often. */
export const FISH_MS = 15_000;
/** A grown mangrove regrows one point of strength this often. */
export const HEAL_MS = 4000;

export const WAVE_POINTS = 10;
export const FISH_POINTS = 3;
export const CLEAR_POINTS = 5;
export const HOUSE_POINTS = 50;

export interface Species {
  id: SpeciesId;
  cost: number;
  /** Time from planting until the tree is grown. */
  growMs: number;
  /** Strength as a seedling, and when grown. */
  hp: [number, number];
  /** How much a wave passing through loses, as a seedling and when grown. */
  damp: [number, number];
}

export const SPECIES: Record<SpeciesId, Species> = {
  'api-api': { id: 'api-api', cost: 2, growMs: 6000, hp: [3, 8], damp: [1, 3] },
  bakau: { id: 'bakau', cost: 4, growMs: 12_000, hp: [4, 14], damp: [1, 5] },
};

export const WAVE_ENERGY: Record<WaveKind, number> = { ripple: 2, wave: 4, big: 7, storm: 11 };
/** Speed of each kind of wave, relative to the level's base speed. */
const WAVE_SPEED: Record<WaveKind, number> = { ripple: 1.15, wave: 1, big: 0.9, storm: 0.8 };
/** Waves at least this strong flood two houses' worth. */
const BIG_FLOOD = 7;

export interface LevelSpec {
  /** Base wave speed in cells per second. */
  speed: number;
  /** Waves in each tide (the storm surge at the end comes on top). */
  tides: number[];
  /** Chance that a wave leaves rubbish where it breaks. */
  rubbish: number;
  /** What rolls into every lane at the very end. */
  surge: WaveKind;
}

export const LEVELS: Record<Level, LevelSpec> = {
  easy: { speed: 0.42, tides: [2, 4, 5, 6, 6], rubbish: 0.15, surge: 'big' },
  normal: { speed: 0.5, tides: [3, 5, 6, 7, 8], rubbish: 0.25, surge: 'storm' },
  hard: { speed: 0.58, tides: [3, 6, 8, 9, 10], rubbish: 0.3, surge: 'storm' },
};

/** Kinds of wave each tide draws from, calm to stormy. */
const TIDE_KINDS: WaveKind[][] = [
  ['ripple'],
  ['ripple', 'wave'],
  ['wave', 'wave', 'big'],
  ['wave', 'big'],
  ['big', 'big', 'storm'],
];
export const FIRST_TIDE_MS = 9000;
export const TIDE_MS = 18_000;

export interface Spawn {
  at: number;
  lane: number;
  kind: WaveKind;
}

/** Every wave of a game: five tides, each rougher than the last, then a storm surge. */
export function makeSchedule(level: Level, rng: Rng): Spawn[] {
  const spec = LEVELS[level];
  const out: Spawn[] = [];
  let lastLane = -1;
  spec.tides.forEach((count, tide) => {
    const kinds = TIDE_KINDS[tide] ?? TIDE_KINDS.at(-1)!;
    const start = FIRST_TIDE_MS + tide * TIDE_MS;
    for (let i = 0; i < count; i++) {
      let lane = Math.floor(rng() * LANES);
      if (lane === lastLane) lane = (lane + 1 + Math.floor(rng() * (LANES - 1))) % LANES;
      lastLane = lane;
      const at = start + ((i + 0.2 + rng() * 0.6) / count) * (TIDE_MS - 2000);
      out.push({ at: Math.round(at), lane, kind: kinds[Math.floor(rng() * kinds.length)]! });
    }
  });
  const surgeAt = FIRST_TIDE_MS + spec.tides.length * TIDE_MS;
  for (let lane = 0; lane < LANES; lane++) {
    out.push({ at: surgeAt + Math.round(rng() * 1500), lane, kind: spec.surge });
  }
  return out.sort((a, b) => a.at - b.at);
}

export interface Plant {
  id: number;
  lane: number;
  col: number;
  species: SpeciesId;
  age: number;
  hp: number;
  grown: boolean;
  /** Time until its next seedling drop, fish and point of regrowth. */
  dropIn: number;
  fishIn: number;
  healIn: number;
}

export interface Wave {
  id: number;
  lane: number;
  /** Position of the wave's front along the lane. */
  x: number;
  energy: number;
  maxEnergy: number;
  kind: WaveKind;
  /** Cells per second. */
  speed: number;
  /** The next mudflat column it will reach. */
  next: number;
}

export type MangroveEvent =
  | { kind: 'wave'; wave: Wave }
  | { kind: 'tide'; tide: number; surge: boolean }
  | { kind: 'hit'; wave: Wave; plant: Plant; uprooted: boolean }
  | { kind: 'broken'; wave: Wave; col: number; points: number }
  | { kind: 'flood'; wave: Wave; houses: number }
  | { kind: 'grown'; plant: Plant }
  | { kind: 'drop'; plant: Plant }
  | { kind: 'fish'; plant: Plant }
  | { kind: 'rubbish'; lane: number; col: number }
  | { kind: 'end'; reason: 'safe' | 'flooded' };

export type PlantFailure = 'taken' | 'rubbish' | 'cost' | 'over';

const key = (lane: number, col: number) => `${lane},${col}`;

export interface GuardOptions {
  /** For end-to-end tests: a short game with one fast ripple in each lane. */
  short?: boolean;
}

/** One game of Mangrove Guard. */
export class Guard {
  readonly spec: LevelSpec;
  readonly schedule: Spawn[];
  plants: Plant[] = [];
  waves: Wave[] = [];
  /** Cells with rubbish on them, as "lane,col". */
  readonly rubbish = new Set<string>();
  seedlings = START_SEEDLINGS;
  houses = HOUSES;
  /** Lanes whose house has been flooded at least once. */
  readonly flooded = new Set<number>();
  score = 0;
  fish = 0;
  broken = 0;
  cleared = 0;
  planted = 0;
  elapsed = 0;
  ended: 'safe' | 'flooded' | null = null;
  private spawned = 0;
  private incomeIn = INCOME_MS;
  private tide = -1;
  private nextId = 1;

  constructor(
    readonly level: Level,
    private readonly rng: Rng,
    opts: GuardOptions = {},
  ) {
    // The short test game also sends its waves in fast.
    this.spec = opts.short ? { ...LEVELS[level], speed: LEVELS[level].speed * 4 } : LEVELS[level];
    this.schedule = opts.short
      ? Array.from({ length: LANES }, (_, lane) => ({
          at: 1000 + lane * 150,
          lane,
          kind: 'ripple',
        }))
      : makeSchedule(level, rng);
  }

  get finished(): boolean {
    return this.ended !== null;
  }

  /** When the last wave sets off, for the progress bar. */
  get lastSpawnAt(): number {
    return this.schedule.at(-1)?.at ?? 0;
  }

  /** Share of the waves that have set off so far, 0–1. */
  get progress(): number {
    return this.schedule.length ? this.spawned / this.schedule.length : 1;
  }

  plantAt(lane: number, col: number): Plant | undefined {
    return this.plants.find((p) => p.lane === lane && p.col === col);
  }

  hasRubbish(lane: number, col: number): boolean {
    return this.rubbish.has(key(lane, col));
  }

  /** Why planting here won't work, or null if it will. */
  canPlant(lane: number, col: number, species: SpeciesId): PlantFailure | null {
    if (this.finished) return 'over';
    if (this.plantAt(lane, col)) return 'taken';
    if (this.hasRubbish(lane, col)) return 'rubbish';
    if (this.seedlings < SPECIES[species].cost) return 'cost';
    return null;
  }

  plant(lane: number, col: number, species: SpeciesId): Plant | PlantFailure {
    if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return 'taken';
    const fail = this.canPlant(lane, col, species);
    if (fail) return fail;
    const sp = SPECIES[species];
    this.seedlings -= sp.cost;
    const plant: Plant = {
      id: this.nextId++,
      lane,
      col,
      species,
      age: 0,
      hp: sp.hp[0],
      grown: false,
      dropIn: DROP_MS,
      fishIn: FISH_MS,
      healIn: HEAL_MS,
    };
    this.plants.push(plant);
    this.planted++;
    return plant;
  }

  /** Picks up the rubbish on a cell. Returns false if there was none. */
  clearRubbish(lane: number, col: number): boolean {
    if (this.finished || !this.rubbish.delete(key(lane, col))) return false;
    this.cleared++;
    this.score += CLEAR_POINTS;
    return true;
  }

  /** Advances the game by `ms` milliseconds. */
  tick(ms: number): MangroveEvent[] {
    if (this.finished) return [];
    const events: MangroveEvent[] = [];
    this.elapsed += ms;

    // The village nursery.
    this.incomeIn -= ms;
    while (this.incomeIn <= 0) {
      this.incomeIn += INCOME_MS;
      this.addSeedlings(1);
    }

    // New waves, and a note when a new tide starts.
    while (this.spawned < this.schedule.length && this.schedule[this.spawned]!.at <= this.elapsed) {
      const s = this.schedule[this.spawned++]!;
      const tide = this.tideOf(s.at);
      if (tide > this.tide) {
        this.tide = tide;
        events.push({ kind: 'tide', tide, surge: tide >= this.spec.tides.length });
      }
      const energy = WAVE_ENERGY[s.kind];
      const wave: Wave = {
        id: this.nextId++,
        lane: s.lane,
        x: COLS + SEA,
        energy,
        maxEnergy: energy,
        kind: s.kind,
        speed: this.spec.speed * WAVE_SPEED[s.kind],
        next: COLS - 1,
      };
      this.waves.push(wave);
      events.push({ kind: 'wave', wave });
    }

    this.growPlants(ms, events);
    this.moveWaves(ms, events);

    if (this.houses <= 0) {
      this.houses = 0;
      this.end('flooded', events);
    } else if (this.spawned >= this.schedule.length && this.waves.length === 0) {
      this.score += this.houses * HOUSE_POINTS;
      this.end('safe', events);
    }
    return events;
  }

  private tideOf(at: number): number {
    return Math.max(
      0,
      Math.min(this.spec.tides.length, Math.floor((at - FIRST_TIDE_MS) / TIDE_MS)),
    );
  }

  private addSeedlings(n: number): void {
    this.seedlings = Math.min(MAX_SEEDLINGS, this.seedlings + n);
  }

  private growPlants(ms: number, events: MangroveEvent[]): void {
    for (const p of this.plants) {
      // Rubbish tangled in the roots stops a mangrove growing.
      if (this.hasRubbish(p.lane, p.col)) continue;
      const sp = SPECIES[p.species];
      p.age += ms;
      if (!p.grown) {
        if (p.age < sp.growMs) continue;
        p.grown = true;
        p.hp = Math.min(sp.hp[1], p.hp + (sp.hp[1] - sp.hp[0]));
        events.push({ kind: 'grown', plant: p });
        continue;
      }
      p.dropIn -= ms;
      if (p.dropIn <= 0) {
        p.dropIn += DROP_MS;
        this.addSeedlings(1);
        events.push({ kind: 'drop', plant: p });
      }
      p.fishIn -= ms;
      if (p.fishIn <= 0) {
        p.fishIn += FISH_MS;
        this.fish++;
        this.score += FISH_POINTS;
        events.push({ kind: 'fish', plant: p });
      }
      p.healIn -= ms;
      if (p.healIn <= 0) {
        p.healIn += HEAL_MS;
        p.hp = Math.min(sp.hp[1], p.hp + 1);
      }
    }
  }

  private moveWaves(ms: number, events: MangroveEvent[]): void {
    for (const w of [...this.waves]) {
      w.x -= (w.speed * ms) / 1000;
      // Each mudflat cell the wave reaches: a mangrove there takes some of its strength.
      while (w.energy > 0 && w.next >= 0 && w.x < w.next + 1) {
        const col = w.next--;
        const p = this.plantAt(w.lane, col);
        if (!p) continue;
        const before = w.energy;
        const sp = SPECIES[p.species];
        w.energy = Math.max(0, before - sp.damp[p.grown ? 1 : 0]);
        p.hp -= Math.ceil(before / 2);
        const uprooted = p.hp <= 0;
        if (uprooted) this.plants.splice(this.plants.indexOf(p), 1);
        events.push({ kind: 'hit', wave: w, plant: p, uprooted });
        if (w.energy <= 0) this.breakWave(w, col, events);
      }
      if (w.energy <= 0) continue;
      if (w.x <= 0) {
        const damage = w.maxEnergy >= BIG_FLOOD && w.energy >= BIG_FLOOD / 2 ? 2 : 1;
        this.houses -= damage;
        this.flooded.add(w.lane);
        this.waves.splice(this.waves.indexOf(w), 1);
        events.push({ kind: 'flood', wave: w, houses: damage });
      }
    }
  }

  private breakWave(w: Wave, col: number, events: MangroveEvent[]): void {
    this.waves.splice(this.waves.indexOf(w), 1);
    const points = w.maxEnergy * WAVE_POINTS;
    this.score += points;
    this.broken++;
    events.push({ kind: 'broken', wave: w, col, points });
    // Waves carry rubbish, which gets caught in the roots where they break.
    if (!this.hasRubbish(w.lane, col) && this.rng() < this.spec.rubbish) {
      this.rubbish.add(key(w.lane, col));
      events.push({ kind: 'rubbish', lane: w.lane, col });
    }
  }

  private end(reason: 'safe' | 'flooded', events: MangroveEvent[]): void {
    this.ended = reason;
    events.push({ kind: 'end', reason });
  }
}

/** Stars for the houses kept dry. */
export function guardStars(houses: number, ended: Guard['ended']): number {
  if (ended !== 'safe') return 0;
  if (houses >= HOUSES) return 3;
  if (houses >= 3) return 2;
  return 1;
}

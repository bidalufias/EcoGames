import type { BuildingKind } from '../../content/city';
import { shuffle, type Rng } from '../../core/random';

export type Level = 'easy' | 'normal';

export const LEVEL_SIZE: Record<Level, number> = { easy: 4, normal: 5 };

/**
 * The building deck for each board size: two cards per cell, since every turn offers
 * two buildings and the player places one.
 */
export const DECKS: Record<number, Record<BuildingKind, number>> = {
  4: { home: 10, park: 6, shop: 4, station: 4, solar: 4, factory: 4 },
  5: { home: 16, park: 10, shop: 6, station: 6, solar: 6, factory: 6 },
};

/** Buildings that solar panels power and that use stations. */
const POWERED = new Set<BuildingKind>(['home', 'shop', 'station', 'factory']);

/** A building's points for the neighbours it has (up, down, left, right). */
export function tileScore(kind: BuildingKind, neighbours: readonly BuildingKind[]): number {
  const count = (...kinds: BuildingKind[]) => neighbours.filter((n) => kinds.includes(n)).length;
  switch (kind) {
    case 'home':
      return count('park', 'shop', 'station') - 2 * count('factory');
    case 'park':
      return count('home', 'park');
    case 'shop':
      return count('home', 'station');
    case 'station':
      return count('home', 'shop', 'factory');
    case 'solar':
      return neighbours.filter((n) => POWERED.has(n)).length;
    case 'factory':
      return 3 + count('station', 'solar');
  }
}

export function buildDeck(size: number, rng: Rng): BuildingKind[] {
  const counts = DECKS[size] ?? DECKS[5]!;
  const cards = (Object.keys(counts) as BuildingKind[]).flatMap((k) =>
    Array.from({ length: counts[k] }, () => k),
  );
  return shuffle(cards, rng);
}

export interface Preview {
  /** Change to the total score if the building goes here. */
  delta: number;
  /** The new building's own points. */
  own: number;
  /** Change to each neighbour's points, by cell index (only non-zero changes). */
  neighbours: Map<number, number>;
}

export interface PlaceResult extends Preview {
  index: number;
  kind: BuildingKind;
}

/** A Green City board: a square grid filled one building per turn. */
export class CityBoard {
  readonly cells: (BuildingKind | null)[];
  /** The two buildings on offer this turn (one near the end of the deck). */
  offer: BuildingKind[] = [];
  turn = 0;
  private readonly deck: BuildingKind[];

  constructor(
    readonly size: number,
    rng: Rng,
    deck?: BuildingKind[],
  ) {
    this.cells = Array.from({ length: size * size }, () => null);
    this.deck = deck ? [...deck] : buildDeck(size, rng);
    this.deal();
  }

  get turns(): number {
    return this.cells.length;
  }

  get done(): boolean {
    return this.cells.every((c) => c !== null);
  }

  /** Indexes of the cells next to `index` (up, down, left, right). */
  neighbourIndexes(index: number): number[] {
    const { size } = this;
    const row = Math.floor(index / size);
    const col = index % size;
    const out: number[] = [];
    if (row > 0) out.push(index - size);
    if (row < size - 1) out.push(index + size);
    if (col > 0) out.push(index - 1);
    if (col < size - 1) out.push(index + 1);
    return out;
  }

  private neighbourKinds(index: number, cells = this.cells): BuildingKind[] {
    return this.neighbourIndexes(index)
      .map((i) => cells[i])
      .filter((k): k is BuildingKind => !!k);
  }

  /** Points for the building at `index` (0 for an empty cell). */
  scoreAt(index: number, cells = this.cells): number {
    const kind = cells[index];
    return kind ? tileScore(kind, this.neighbourKinds(index, cells)) : 0;
  }

  total(): number {
    return this.cells.reduce((sum, _, i) => sum + this.scoreAt(i), 0);
  }

  /** What placing `kind` at `index` would do, or null if the cell is taken. */
  preview(index: number, kind: BuildingKind): Preview | null {
    if (this.cells[index] !== null || index < 0 || index >= this.cells.length) return null;
    const next = [...this.cells];
    next[index] = kind;
    const own = this.scoreAt(index, next);
    const neighbours = new Map<number, number>();
    let delta = own;
    for (const n of this.neighbourIndexes(index)) {
      if (!this.cells[n]) continue;
      const change = this.scoreAt(n, next) - this.scoreAt(n);
      if (change !== 0) neighbours.set(n, change);
      delta += change;
    }
    return { delta, own, neighbours };
  }

  /** Places offer number `choice` at `index`. Returns null if that isn't possible. */
  place(index: number, choice: number): PlaceResult | null {
    const kind = this.offer[choice];
    if (!kind || this.done) return null;
    const preview = this.preview(index, kind);
    if (!preview) return null;
    this.cells[index] = kind;
    this.turn++;
    this.deal();
    return { ...preview, index, kind };
  }

  /** Offers the next two buildings, making sure they differ when the deck allows. */
  private deal(): void {
    if (this.done) {
      this.offer = [];
      return;
    }
    const first = this.deck.shift();
    if (!first) {
      this.offer = [];
      return;
    }
    const other = this.deck.findIndex((k) => k !== first);
    const second = other >= 0 ? this.deck.splice(other, 1)[0] : this.deck.shift();
    this.offer = second ? [first, second] : [first];
  }

  /** How many of each building are on the board. */
  counts(): Record<BuildingKind, number> {
    const out: Record<BuildingKind, number> = {
      home: 0,
      park: 0,
      shop: 0,
      station: 0,
      solar: 0,
      factory: 0,
    };
    for (const c of this.cells) if (c) out[c]++;
    return out;
  }

  /** Homes with a station, and homes with a factory, next door. */
  homeStats(): { homes: number; nearStation: number; nearFactory: number } {
    let homes = 0;
    let nearStation = 0;
    let nearFactory = 0;
    this.cells.forEach((c, i) => {
      if (c !== 'home') return;
      homes++;
      const around = this.neighbourKinds(i);
      if (around.includes('station')) nearStation++;
      if (around.includes('factory')) nearFactory++;
    });
    return { homes, nearStation, nearFactory };
  }
}

/**
 * Scores needed for one, two and three stars on each board size. Placing at random
 * scores about 25 (4×4) and 40 (5×5); always taking the best spot this turn scores
 * about 48 and 82.
 */
export const STAR_SCORES: Record<number, [number, number, number]> = {
  4: [30, 40, 46],
  5: [52, 68, 78],
};

export function cityStars(score: number, size: number): number {
  const [one, two, three] = STAR_SCORES[size] ?? STAR_SCORES[5]!;
  if (score >= three) return 3;
  if (score >= two) return 2;
  if (score >= one) return 1;
  return 0;
}

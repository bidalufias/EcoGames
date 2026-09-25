import type { Concept } from '../../content/concepts';
import { sample, shuffle, type Rng } from '../../core/random';

export type Difficulty = 'easy' | 'medium' | 'hard';

export const PAIRS: Record<Difficulty, number> = { easy: 6, medium: 8, hard: 12 };

export interface Card {
  /** Position-independent unique id. */
  uid: string;
  concept: Concept;
  /** Each pair has one picture-led card and one word-led card. */
  face: 'picture' | 'word';
  faceUp: boolean;
  matched: boolean;
  /** Which player matched it (0 or 1), for two-player colouring. */
  matchedBy: number | null;
}

export type FlipOutcome =
  | { kind: 'ignored' }
  | { kind: 'flipped' }
  | { kind: 'match'; concept: Concept; finished: boolean }
  | { kind: 'mismatch' };

export function buildDeck(
  concepts: readonly Concept[],
  pairs: number,
  rng: Rng = Math.random,
): Card[] {
  const chosen = sample(concepts, pairs, rng);
  const cards = chosen.flatMap((concept): Card[] =>
    (['picture', 'word'] as const).map((face) => ({
      uid: `${concept.id}:${face}`,
      concept,
      face,
      faceUp: false,
      matched: false,
      matchedBy: null,
    })),
  );
  return shuffle(cards, rng);
}

/** Pure game state for Eco Memory. The view calls these methods and renders `cards`. */
export class MemoryGame {
  readonly cards: Card[];
  readonly players: number;
  moves = 0;
  currentPlayer = 0;
  readonly pairsFound: number[];
  private open: number[] = [];

  constructor(cards: Card[], players = 1) {
    this.cards = cards;
    this.players = players;
    this.pairsFound = Array.from({ length: players }, () => 0);
  }

  get totalPairs(): number {
    return this.cards.length / 2;
  }

  get matchedPairs(): number {
    return this.pairsFound.reduce((a, b) => a + b, 0);
  }

  get finished(): boolean {
    return this.matchedPairs === this.totalPairs;
  }

  /** True while two unmatched cards are showing and must be turned back first. */
  get awaitingReset(): boolean {
    return this.open.length === 2;
  }

  flip(index: number): FlipOutcome {
    const card = this.cards[index];
    if (!card || card.faceUp || card.matched || this.awaitingReset) return { kind: 'ignored' };

    card.faceUp = true;
    this.open.push(index);
    if (this.open.length === 1) return { kind: 'flipped' };

    this.moves++;
    const [a, b] = this.open.map((i) => this.cards[i] as Card) as [Card, Card];
    if (a.concept.id === b.concept.id) {
      a.matched = b.matched = true;
      a.matchedBy = b.matchedBy = this.currentPlayer;
      this.pairsFound[this.currentPlayer]!++;
      this.open = [];
      // A match earns another turn, so currentPlayer stays the same.
      return { kind: 'match', concept: a.concept, finished: this.finished };
    }
    return { kind: 'mismatch' };
  }

  /** Turns the two mismatched cards back over and passes the turn. */
  resetMismatch(): void {
    for (const i of this.open) {
      const card = this.cards[i];
      if (card) card.faceUp = false;
    }
    this.open = [];
    this.currentPlayer = (this.currentPlayer + 1) % this.players;
  }

  /** Index of the winning player, or null for a draw. */
  winner(): number | null {
    const best = Math.max(...this.pairsFound);
    const leaders = this.pairsFound.flatMap((p, i) => (p === best ? [i] : []));
    return leaders.length === 1 ? (leaders[0] ?? null) : null;
  }
}

/** 3 stars for near-perfect memory, down to 1 star for finishing at all. */
export function starsFor(pairs: number, moves: number): number {
  if (moves <= Math.ceil(pairs * 1.6)) return 3;
  if (moves <= Math.ceil(pairs * 2.4)) return 2;
  return 1;
}

/** Solo score: rewards bigger boards, fewer moves and faster play. */
export function scoreFor(pairs: number, moves: number, seconds: number): number {
  const accuracy = pairs / Math.max(moves, pairs);
  const speedBonus = Math.max(0, pairs * 8 - seconds) * 5;
  return Math.round(pairs * 100 * accuracy + speedBonus);
}

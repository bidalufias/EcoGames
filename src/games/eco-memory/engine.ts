// Eco Memory engine — pure logic separated from rendering. Mirrors the
// Climate 2048 split (engine.ts vs components/) so the React layer only deals
// with input + animation, never with deck shuffling or match arithmetic.

import { GHG_PAIRS, type PairDef } from './data';

export interface CardDef {
  /** Stable id for the lifetime of a single game (used as React key). */
  id: number;
  /** Index into GHG_PAIRS — the two cards of a match share a pairId. */
  pairId: number;
  /** Which side of the pair this card represents. */
  side: 'gas' | 'source';
  emoji: string;
  label: string;
  color: string;
  fact: string;
}

export interface CardState {
  flipped: boolean;
  matched: boolean;
}

export interface GameState {
  deck: CardDef[];
  cards: Record<number, CardState>;
  flippedIds: number[];
  moves: number;
  matches: number;
  /** Consecutive matches without a miss — drives the streak bonus. */
  streak: number;
  /** Current accumulated score. */
  score: number;
  /** Facts unlocked, in match order, for an end-of-game journal. */
  unlocked: { pairId: number; fact: string; label: string; emoji: string; color: string }[];
  startedAt: number;
}

export interface MoveResult {
  state: GameState;
  /** Were the two flipped cards a match? */
  matched: boolean;
  /** Score added for this turn (match bonus + streak). */
  delta: number;
  /** Pair completed this turn (for fact popups). */
  completedPair?: { fact: string; label: string; emoji: string; color: string };
  /** Game finished on this turn. */
  finished: boolean;
}

const MATCH_BASE = 100;
const STREAK_BONUS = 25; // per consecutive match beyond the first
const MISS_PENALTY = 5;  // tiny per-miss penalty so brute force is sub-optimal

/** Fisher–Yates shuffle, optionally seeded for deterministic replays. */
function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build a fresh deck from a list of pair definitions. */
export function buildDeck(pairs: PairDef[] = GHG_PAIRS): CardDef[] {
  const deck: CardDef[] = [];
  let id = 0;
  pairs.forEach((p, pairId) => {
    deck.push({
      id: id++,
      pairId,
      side: 'gas',
      emoji: p.emoji,
      label: p.label,
      color: p.color,
      fact: p.fact,
    });
    deck.push({
      id: id++,
      pairId,
      side: 'source',
      emoji: p.sourceEmoji,
      label: p.source,
      color: p.color,
      fact: p.fact,
    });
  });
  return shuffle(deck);
}

export function startGame(pairs: PairDef[] = GHG_PAIRS): GameState {
  const deck = buildDeck(pairs);
  const cards: Record<number, CardState> = {};
  for (const c of deck) cards[c.id] = { flipped: false, matched: false };
  return {
    deck,
    cards,
    flippedIds: [],
    moves: 0,
    matches: 0,
    streak: 0,
    score: 0,
    unlocked: [],
    startedAt: Date.now(),
  };
}

/** Reveal a card. Caller must check `canFlip` first. */
export function flipCard(state: GameState, id: number): GameState {
  if (!canFlip(state, id)) return state;
  return {
    ...state,
    cards: { ...state.cards, [id]: { ...state.cards[id], flipped: true } },
    flippedIds: [...state.flippedIds, id],
  };
}

/**
 * Reveal (or hide) every unmatched card at once. Used by study mode to show
 * the full deck face-up before play begins, then flip everything back.
 */
export function revealAll(state: GameState, value: boolean): GameState {
  const cards: Record<number, CardState> = {};
  for (const id in state.cards) {
    const c = state.cards[id];
    cards[id] = c.matched ? c : { ...c, flipped: value };
  }
  return { ...state, cards, flippedIds: [] };
}

export function canFlip(state: GameState, id: number): boolean {
  const card = state.cards[id];
  if (!card || card.flipped || card.matched) return false;
  if (state.flippedIds.length >= 2) return false;
  return true;
}

/**
 * Resolve a pair of flipped cards. Idempotent — caller invokes this once both
 * cards have been flipped (i.e. `state.flippedIds.length === 2`).
 *
 * Returns the next state plus per-turn metadata (delta, fact, finished) so the
 * UI can animate score deltas and fact pop-ups without re-deriving them.
 */
export function resolveTurn(state: GameState, totalPairs: number): MoveResult {
  if (state.flippedIds.length !== 2) {
    return { state, matched: false, delta: 0, finished: false };
  }
  const [aId, bId] = state.flippedIds;
  const a = state.deck.find(c => c.id === aId)!;
  const b = state.deck.find(c => c.id === bId)!;
  const moves = state.moves + 1;

  if (a.pairId === b.pairId) {
    const streak = state.streak + 1;
    const delta = MATCH_BASE + Math.max(0, streak - 1) * STREAK_BONUS;
    const cards: Record<number, CardState> = { ...state.cards };
    cards[aId] = { flipped: true, matched: true };
    cards[bId] = { flipped: true, matched: true };
    const completedPair = { fact: a.fact, label: a.label, emoji: a.emoji, color: a.color };
    const next: GameState = {
      ...state,
      cards,
      flippedIds: [],
      moves,
      matches: state.matches + 1,
      streak,
      score: state.score + delta,
      unlocked: [...state.unlocked, { pairId: a.pairId, ...completedPair }],
    };
    return {
      state: next,
      matched: true,
      delta,
      completedPair,
      finished: next.matches === totalPairs,
    };
  }

  // Miss: small penalty, reset streak, clear flips.
  const cards: Record<number, CardState> = { ...state.cards };
  cards[aId] = { ...cards[aId], flipped: false };
  cards[bId] = { ...cards[bId], flipped: false };
  const score = Math.max(0, state.score - MISS_PENALTY);
  const next: GameState = {
    ...state,
    cards,
    flippedIds: [],
    moves,
    streak: 0,
    score,
  };
  return { state: next, matched: false, delta: -MISS_PENALTY, finished: false };
}

/** Star rating used on the game-over screen. */
export function rating(moves: number, totalPairs: number): string {
  if (moves <= totalPairs + 2) return '🏆 Perfect!';
  if (moves <= totalPairs * 2) return '⭐ Great!';
  if (moves <= totalPairs * 3) return '👍 Good!';
  return '🌱 Keep Learning!';
}

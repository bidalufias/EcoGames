import { describe, expect, it } from 'vitest';
import { CONCEPTS } from '../../content/concepts';
import { seededRng } from '../../core/random';
import { MemoryGame, PAIRS, buildDeck, scoreFor, starsFor } from './logic';

function pairIndexes(game: MemoryGame): [number, number][] {
  const byConcept = new Map<string, number[]>();
  game.cards.forEach((c, i) =>
    byConcept.set(c.concept.id, [...(byConcept.get(c.concept.id) ?? []), i]),
  );
  return [...byConcept.values()] as [number, number][];
}

describe('buildDeck', () => {
  it.each(Object.entries(PAIRS))(
    'builds %s deck with one picture and one word card per pair',
    (_, pairs) => {
      const deck = buildDeck(CONCEPTS, pairs, seededRng(1));
      expect(deck).toHaveLength(pairs * 2);
      const ids = new Set(deck.map((c) => c.concept.id));
      expect(ids.size).toBe(pairs);
      for (const id of ids) {
        const faces = deck.filter((c) => c.concept.id === id).map((c) => c.face);
        expect(faces.sort()).toEqual(['picture', 'word']);
      }
    },
  );

  it('has enough concepts for the hardest level', () => {
    expect(CONCEPTS.length).toBeGreaterThanOrEqual(PAIRS.hard);
  });
});

describe('MemoryGame', () => {
  it('matches a pair and finishes the game when all pairs are found', () => {
    const game = new MemoryGame(buildDeck(CONCEPTS, 2, seededRng(2)));
    const pairs = pairIndexes(game);
    const [a, b] = pairs[0]!;
    expect(game.flip(a).kind).toBe('flipped');
    expect(game.flip(b)).toMatchObject({ kind: 'match', finished: false });
    const [c, d] = pairs[1]!;
    game.flip(c);
    expect(game.flip(d)).toMatchObject({ kind: 'match', finished: true });
    expect(game.moves).toBe(2);
    expect(game.finished).toBe(true);
  });

  it('requires a reset after a mismatch and ignores clicks until then', () => {
    const game = new MemoryGame(buildDeck(CONCEPTS, 3, seededRng(3)));
    const pairs = pairIndexes(game);
    game.flip(pairs[0]![0]);
    expect(game.flip(pairs[1]![0]).kind).toBe('mismatch');
    expect(game.flip(pairs[2]![0]).kind).toBe('ignored');
    game.resetMismatch();
    expect(game.cards.filter((c) => c.faceUp)).toHaveLength(0);
    expect(game.flip(pairs[2]![0]).kind).toBe('flipped');
  });

  it('ignores flipping the same card twice', () => {
    const game = new MemoryGame(buildDeck(CONCEPTS, 2, seededRng(4)));
    game.flip(0);
    expect(game.flip(0).kind).toBe('ignored');
  });

  it('passes the turn on a mismatch and keeps it on a match in two-player mode', () => {
    const game = new MemoryGame(buildDeck(CONCEPTS, 3, seededRng(5)), 2);
    const pairs = pairIndexes(game);
    game.flip(pairs[0]![0]);
    game.flip(pairs[0]![1]);
    expect(game.currentPlayer).toBe(0);
    game.flip(pairs[1]![0]);
    game.flip(pairs[2]![0]);
    game.resetMismatch();
    expect(game.currentPlayer).toBe(1);
    game.flip(pairs[1]![0]);
    game.flip(pairs[1]![1]);
    expect(game.pairsFound).toEqual([1, 1]);
    expect(game.winner()).toBeNull();
  });
});

describe('scoring', () => {
  it('gives 3 stars for a perfect game and fewer for many moves', () => {
    expect(starsFor(8, 8)).toBe(3);
    expect(starsFor(8, 18)).toBe(2);
    expect(starsFor(8, 40)).toBe(1);
  });

  it('scores fewer moves and faster play higher', () => {
    expect(scoreFor(8, 8, 30)).toBeGreaterThan(scoreFor(8, 16, 30));
    expect(scoreFor(8, 12, 20)).toBeGreaterThan(scoreFor(8, 12, 90));
    expect(scoreFor(12, 12, 60)).toBeGreaterThan(scoreFor(6, 6, 60));
  });
});

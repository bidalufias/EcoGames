import { describe, expect, it } from 'vitest';
import type { BuildingKind } from '../../content/city';
import { seededRng } from '../../core/random';
import { CityBoard, DECKS, LEVEL_SIZE, buildDeck, cityStars, tileScore } from './logic';

/** A 3×3 board with a fixed deck, for hand-checked layouts. */
function board(deck: BuildingKind[], size = 3): CityBoard {
  return new CityBoard(size, seededRng(1), deck);
}

describe('tileScore', () => {
  it('scores each building by its neighbours', () => {
    expect(tileScore('home', ['park', 'shop', 'station'])).toBe(3);
    expect(tileScore('home', ['park', 'factory'])).toBe(-1);
    expect(tileScore('park', ['home', 'park', 'factory'])).toBe(2);
    expect(tileScore('shop', ['home', 'home', 'station', 'park'])).toBe(3);
    expect(tileScore('station', ['home', 'shop', 'factory', 'park'])).toBe(3);
    expect(tileScore('solar', ['home', 'shop', 'station', 'factory'])).toBe(4);
    expect(tileScore('solar', ['park', 'solar'])).toBe(0);
    expect(tileScore('factory', [])).toBe(3);
    expect(tileScore('factory', ['station', 'solar', 'home'])).toBe(5);
  });
});

describe('the deck', () => {
  it.each(Object.values(LEVEL_SIZE))('has two buildings per cell on a %i board', (size) => {
    const counts = DECKS[size]!;
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(size * size * 2);
    expect(buildDeck(size, seededRng(3))).toHaveLength(size * size * 2);
  });

  it('offers two different buildings when it can', () => {
    const b = board(['home', 'home', 'park', 'home', 'home']);
    expect(b.offer).toEqual(['home', 'park']);
    b.place(0, 0);
    expect(b.offer).toEqual(['home', 'home']);
  });
});

describe('CityBoard', () => {
  it('finds the neighbours of corner, edge and middle cells', () => {
    const b = board([]);
    expect(b.neighbourIndexes(0).sort()).toEqual([1, 3]);
    expect(b.neighbourIndexes(4).sort()).toEqual([1, 3, 5, 7]);
    expect(b.neighbourIndexes(5).sort()).toEqual([2, 4, 8]);
  });

  it('previews the change to the whole score, neighbours included', () => {
    const b = board(['home', 'shop', 'factory', 'park', 'park', 'park']);
    b.place(4, 0); // home in the middle
    expect(b.total()).toBe(0);
    // A factory next to the home: +3 for the factory, −2 for the home.
    const p = b.preview(1, 'factory')!;
    expect(p).toEqual({ delta: 1, own: 3, neighbours: new Map([[4, -2]]) });
    expect(b.preview(4, 'park')).toBeNull();
  });

  it('places the chosen offer and deals the next pair', () => {
    const b = board(['home', 'shop', 'park', 'station']);
    const r = b.place(0, 1)!;
    expect(r).toMatchObject({ index: 0, kind: 'shop', delta: 0 });
    expect(b.cells[0]).toBe('shop');
    expect(b.turn).toBe(1);
    expect(b.offer).toEqual(['park', 'station']);
    expect(b.place(0, 0)).toBeNull();
    expect(b.place(1, 5)).toBeNull();
    const r2 = b.place(1, 1)!; // station next to the shop: +1 each
    expect(r2.delta).toBe(2);
    expect(b.total()).toBe(2);
  });

  it('ends when every cell is filled', () => {
    const b = new CityBoard(LEVEL_SIZE.easy, seededRng(5));
    for (let i = 0; i < b.turns; i++) expect(b.place(i, 0)).not.toBeNull();
    expect(b.done).toBe(true);
    expect(b.offer).toEqual([]);
    expect(b.place(0, 0)).toBeNull();
    const counts = b.counts();
    expect(Object.values(counts).reduce((a, c) => a + c, 0)).toBe(b.turns);
  });

  it('counts homes next to stations and factories', () => {
    const b = board(['home', 'station', 'home', 'factory', 'home', 'park', 'home', 'solar']);
    b.place(4, 1); // station in the middle
    b.place(1, 1); // factory above it
    b.place(3, 0); // home left of the station
    b.place(0, 0); // home in the corner, next to the factory
    expect(b.homeStats()).toEqual({ homes: 2, nearStation: 1, nearFactory: 1 });
    expect(b.counts()).toMatchObject({ home: 2, station: 1, factory: 1, park: 0 });
  });

  it('is deterministic for a seed', () => {
    const a = new CityBoard(5, seededRng(9));
    const c = new CityBoard(5, seededRng(9));
    expect(a.offer).toEqual(c.offer);
  });
});

describe('stars', () => {
  it('needs more points for each star, and more on the bigger board', () => {
    expect([0, 30, 40, 46].map((s) => cityStars(s, 4))).toEqual([0, 1, 2, 3]);
    expect([45, 52, 68, 78].map((s) => cityStars(s, 5))).toEqual([0, 1, 2, 3]);
  });
});

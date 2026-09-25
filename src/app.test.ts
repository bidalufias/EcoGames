import { describe, expect, it } from 'vitest';
import { parseRoute } from './app';
import { CATEGORIES, GAMES, findGame, gameOfTheDay } from './games/registry';

describe('parseRoute', () => {
  it('routes to the hub by default', () => {
    expect(parseRoute('')).toEqual({ name: 'hub', category: null });
    expect(parseRoute('#/')).toEqual({ name: 'hub', category: null });
    expect(parseRoute('#/nope/x')).toEqual({ name: 'hub', category: null });
  });

  it('routes to a category, ignoring unknown ones', () => {
    expect(parseRoute('#/c/quiz')).toEqual({ name: 'hub', category: 'quiz' });
    expect(parseRoute('#/c/unknown')).toEqual({ name: 'hub', category: null });
  });

  it('routes to a game', () => {
    expect(parseRoute('#/play/eco-quiz')).toEqual({ name: 'game', id: 'eco-quiz' });
    expect(parseRoute('#/play/eco-quiz/')).toEqual({ name: 'game', id: 'eco-quiz' });
  });
});

describe('registry', () => {
  it('has unique, URL-safe game ids', () => {
    const ids = GAMES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    expect(findGame('eco-memory')?.title).toBe('Eco Memory');
  });

  it('puts every game in a known category with art and how-to text', () => {
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const g of GAMES) {
      expect(cats.has(g.category), g.id).toBe(true);
      expect(g.art.length, g.id).toBeGreaterThanOrEqual(2);
      expect(g.howTo.length, g.id).toBeGreaterThan(0);
    }
  });

  it('features a different game on consecutive days', () => {
    const day = new Date('2026-01-01T12:00:00Z');
    const next = new Date('2026-01-02T12:00:00Z');
    expect(gameOfTheDay(day).id).not.toBe(gameOfTheDay(next).id);
  });
});

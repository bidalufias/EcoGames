import { describe, expect, it } from 'vitest';
import { parseRoute } from './app';
import { GAMES, findGame } from './games/registry';

describe('parseRoute', () => {
  it('routes to the hub by default', () => {
    expect(parseRoute('')).toEqual({ name: 'hub' });
    expect(parseRoute('#/')).toEqual({ name: 'hub' });
    expect(parseRoute('#/nope/x')).toEqual({ name: 'hub' });
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
});

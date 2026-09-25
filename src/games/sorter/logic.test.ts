import { describe, expect, it } from 'vitest';
import { BINS, WASTE_ITEMS } from '../../content/waste';
import { seededRng } from '../../core/random';
import {
  ItemBag,
  START_LIVES,
  SorterState,
  fallSpeed,
  maxOnScreen,
  multiplierFor,
  sorterStars,
  spawnInterval,
} from './logic';

const item = (bin: string) => WASTE_ITEMS.find((i) => i.bin === bin)!;

describe('SorterState', () => {
  it('awards points with a growing streak multiplier', () => {
    const s = new SorterState();
    const scores = Array.from({ length: 4 }, () => s.sort(item('recycle'), 'recycle').points);
    expect(scores).toEqual([10, 10, 20, 20]);
    expect(s.score).toBe(60);
    expect(s.sorted).toBe(4);
  });

  it('loses a life and resets the streak on a wrong bin or a miss', () => {
    const s = new SorterState();
    s.sort(item('compost'), 'compost');
    const wrong = s.sort(item('dropoff'), 'general');
    expect(wrong.correct).toBe(false);
    expect(s.lives).toBe(START_LIVES - 1);
    expect(s.streak).toBe(0);
    s.miss(item('general'));
    expect(s.lives).toBe(START_LIVES - 2);
    expect(s.mistakes.map((m) => m.bin)).toEqual(['dropoff', 'general']);
  });

  it('ends the game when lives run out', () => {
    const s = new SorterState();
    let last;
    for (let i = 0; i < START_LIVES; i++) last = s.miss(item('recycle'));
    expect(last?.gameOver).toBe(true);
    expect(s.gameOver).toBe(true);
    expect(s.sort(item('recycle'), 'recycle').points).toBe(0);
    expect(s.mistakes).toHaveLength(1);
  });
});

describe('difficulty curve', () => {
  it('gets faster and busier but stays within limits', () => {
    expect(fallSpeed(50)).toBeGreaterThan(fallSpeed(0));
    expect(fallSpeed(1000)).toBeLessThanOrEqual(0.24);
    expect(spawnInterval(1000)).toBeGreaterThanOrEqual(1100);
    expect(maxOnScreen(0)).toBe(1);
    expect(maxOnScreen(100)).toBe(3);
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(12)).toBe(4);
  });

  it('maps score to stars', () => {
    expect(sorterStars(0)).toBe(0);
    expect(sorterStars(50)).toBe(1);
    expect(sorterStars(200)).toBe(2);
    expect(sorterStars(500)).toBe(3);
  });
});

describe('ItemBag', () => {
  it('deals every item once before repeating', () => {
    const bag = new ItemBag(WASTE_ITEMS, seededRng(3));
    const firstRound = Array.from({ length: WASTE_ITEMS.length }, () => bag.next().id);
    expect(new Set(firstRound).size).toBe(WASTE_ITEMS.length);
  });
});

describe('waste content', () => {
  it('uses only known bins and has several items for every bin', () => {
    const binIds = new Set(BINS.map((b) => b.id));
    for (const w of WASTE_ITEMS) expect(binIds.has(w.bin)).toBe(true);
    for (const b of BINS)
      expect(WASTE_ITEMS.filter((w) => w.bin === b.id).length).toBeGreaterThanOrEqual(4);
  });
});

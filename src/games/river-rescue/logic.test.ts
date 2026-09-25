import { describe, expect, it } from 'vitest';
import { RIVER_FACTS, RIVER_ITEMS } from '../../content/river';
import { seededRng } from '../../core/random';
import {
  MIN_ANIMAL_GAP_MS,
  MIN_SPREAD,
  RiverSpawner,
  RiverState,
  START_LIVES,
  TRIP_MS,
  animalChance,
  flowSpeed,
  maxOnScreen,
  multiplierFor,
  riverLearned,
  riverStars,
  spawnInterval,
} from './logic';

const rubbish = (id: string) => RIVER_ITEMS.find((i) => i.id === id && i.kind === 'rubbish')!;
const animal = (id: string) => RIVER_ITEMS.find((i) => i.id === id && i.kind === 'animal')!;

describe('RiverState', () => {
  it('awards points with a growing streak multiplier', () => {
    const s = new RiverState();
    const points = Array.from({ length: 4 }, () => s.catchRubbish().points);
    expect(points).toEqual([10, 10, 20, 20]);
    expect(s.score).toBe(60);
    expect(s.caught).toBe(4);
    expect(s.bestStreak).toBe(4);
  });

  it('breaks the streak but keeps lives when rubbish escapes', () => {
    const s = new RiverState();
    s.catchRubbish();
    s.catchRubbish();
    s.escape(rubbish('bag'));
    s.escape(rubbish('bag'));
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(2);
    expect(s.lives).toBe(START_LIVES);
    expect(s.escaped).toBe(2);
    expect(s.escapedItems.map((i) => i.id)).toEqual(['bag']);
    expect(s.catchRubbish().points).toBe(10);
  });

  it('loses a life and the streak when bumping an animal', () => {
    const s = new RiverState();
    s.catchRubbish();
    const first = s.bumpAnimal(animal('otter'));
    expect(first).toEqual({ firstTime: true, gameOver: false });
    expect(s.lives).toBe(START_LIVES - 1);
    expect(s.streak).toBe(0);
    expect(s.bumpAnimal(animal('otter')).firstTime).toBe(false);
    expect(s.bumped.map((i) => i.id)).toEqual(['otter']);
  });

  it('ends when lives run out', () => {
    const s = new RiverState();
    let last;
    for (let i = 0; i < START_LIVES; i++) last = s.bumpAnimal(animal('duck'));
    expect(last?.gameOver).toBe(true);
    expect(s.gameOver).toBe(true);
    expect(s.finished).toBe(false);
    expect(s.catchRubbish().points).toBe(0);
    expect(s.score).toBe(0);
  });

  it('ends when the trip is over and counts down whole seconds', () => {
    const s = new RiverState();
    expect(s.secondsLeft).toBe(TRIP_MS / 1000);
    expect(s.tick(500)).toBe(false);
    expect(s.secondsLeft).toBe(TRIP_MS / 1000);
    expect(s.tick(TRIP_MS - 1500)).toBe(false);
    expect(s.secondsLeft).toBe(1);
    expect(s.tick(2000)).toBe(true);
    expect(s.timeLeft).toBe(0);
    expect(s.finished).toBe(true);
    expect(s.tick(100)).toBe(false);
    s.escape(rubbish('tin'));
    expect(s.escaped).toBe(0);
  });

  it('supports a shorter trip', () => {
    const s = new RiverState(5000);
    expect(s.secondsLeft).toBe(5);
    expect(s.tick(5000)).toBe(true);
  });
});

describe('difficulty curve', () => {
  it('gets faster and busier along the trip, within limits', () => {
    expect(flowSpeed(TRIP_MS)).toBeGreaterThan(flowSpeed(0));
    expect(flowSpeed(TRIP_MS * 3)).toBe(flowSpeed(TRIP_MS));
    expect(spawnInterval(TRIP_MS)).toBeLessThan(spawnInterval(0));
    expect(spawnInterval(TRIP_MS * 3)).toBeGreaterThanOrEqual(600);
    expect(animalChance(0)).toBe(0);
    expect(animalChance(TRIP_MS)).toBeGreaterThan(animalChance(10_000));
    expect(animalChance(TRIP_MS)).toBeLessThanOrEqual(0.4);
    expect(maxOnScreen(0)).toBe(4);
    expect(maxOnScreen(TRIP_MS)).toBe(7);
  });

  it('is gentler on phones', () => {
    expect(flowSpeed(0, true)).toBeLessThan(flowSpeed(0));
    expect(spawnInterval(0, true)).toBeGreaterThan(spawnInterval(0));
    expect(maxOnScreen(TRIP_MS, true)).toBeLessThan(maxOnScreen(TRIP_MS));
    expect(maxOnScreen(0, true)).toBeGreaterThanOrEqual(2);
  });

  it('maps multipliers and stars', () => {
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(3)).toBe(2);
    expect(multiplierFor(6)).toBe(3);
    expect(multiplierFor(12)).toBe(4);
    expect(riverStars(0)).toBe(0);
    expect(riverStars(50)).toBe(1);
    expect(riverStars(250)).toBe(2);
    expect(riverStars(700)).toBe(3);
  });
});

describe('RiverSpawner', () => {
  it('only sends rubbish at the start of the trip', () => {
    const spawner = new RiverSpawner(RIVER_ITEMS, seededRng(1));
    for (let t = 0; t < 2500; t += 100) expect(spawner.next(t).item.kind).toBe('rubbish');
  });

  it('deals every kind of rubbish before repeating', () => {
    const spawner = new RiverSpawner(RIVER_ITEMS, seededRng(2));
    const count = RIVER_ITEMS.filter((i) => i.kind === 'rubbish').length;
    const ids = Array.from({ length: count }, () => spawner.next(0).item.id);
    expect(new Set(ids).size).toBe(count);
  });

  it('keeps items spread out and animals apart, so the boat can always get through', () => {
    for (const seed of [3, 4, 5]) {
      const spawner = new RiverSpawner(RIVER_ITEMS, seededRng(seed));
      let lastX = -1;
      let lastAnimal = Number.NEGATIVE_INFINITY;
      let animals = 0;
      for (let t = 0; t < TRIP_MS; t += 300) {
        const { item, x } = spawner.next(t);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(1);
        if (lastX >= 0) expect(Math.abs(x - lastX)).toBeGreaterThanOrEqual(MIN_SPREAD - 1e-9);
        lastX = x;
        if (item.kind === 'animal') {
          expect(t - lastAnimal).toBeGreaterThanOrEqual(MIN_ANIMAL_GAP_MS);
          lastAnimal = t;
          animals++;
        }
      }
      expect(animals).toBeGreaterThan(5);
    }
  });
});

describe('riverLearned', () => {
  it('lists escaped rubbish, then bumped animals, then river facts', () => {
    const s = new RiverState();
    s.escape(rubbish('polystyrene'));
    s.bumpAnimal(animal('turtle'));
    const learned = riverLearned(s);
    expect(learned).toHaveLength(4);
    expect(learned.map((l) => l.term)).toEqual([
      'Polystyrene box',
      'Turtle',
      RIVER_FACTS[0]!.term,
      RIVER_FACTS[1]!.term,
    ]);
  });

  it('falls back to river facts after a perfect run', () => {
    const learned = riverLearned(new RiverState());
    expect(learned.map((l) => l.detail)).toEqual(RIVER_FACTS.slice(0, 4).map((f) => f.detail));
  });
});

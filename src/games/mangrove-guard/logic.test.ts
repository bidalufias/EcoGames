import { describe, expect, it } from 'vitest';
import { seededRng } from '../../core/random';
import {
  CLEAR_POINTS,
  COLS,
  DROP_MS,
  FIRST_TIDE_MS,
  FISH_MS,
  Guard,
  HOUSES,
  HOUSE_POINTS,
  INCOME_MS,
  LANES,
  LEVELS,
  MAX_SEEDLINGS,
  SEA,
  SPECIES,
  START_SEEDLINGS,
  WAVE_ENERGY,
  WAVE_POINTS,
  guardStars,
  makeSchedule,
  type Level,
  type MangroveEvent,
  type WaveKind,
} from './logic';

const LEVEL_IDS = Object.keys(LEVELS) as Level[];

/** Clears a game's waves, leaving one far in the future so the game doesn't end. */
function hush(g: Guard): Guard {
  g.schedule.splice(0, g.schedule.length, { at: 1e9, lane: 0, kind: 'ripple' });
  return g;
}

/** A game with no waves on the way, so tests can send in their own. */
function quiet(level: Level = 'normal', seed = 1): Guard {
  return hush(new Guard(level, seededRng(seed)));
}

/** Sends a wave down a lane from the edge of the sea. */
function send(g: Guard, lane: number, kind: WaveKind): void {
  const energy = WAVE_ENERGY[kind];
  g.waves.push({
    id: 999 + g.waves.length,
    lane,
    x: COLS + SEA,
    energy,
    maxEnergy: energy,
    kind,
    speed: 1,
    next: COLS - 1,
  });
}

function run(g: Guard, ms: number, step = 100): MangroveEvent[] {
  const events: MangroveEvent[] = [];
  for (let t = 0; t < ms && !g.finished; t += step) events.push(...g.tick(step));
  return events;
}

/** Plants and fully grows a mangrove. */
function grown(g: Guard, lane: number, col: number, species: 'api-api' | 'bakau') {
  g.seedlings = MAX_SEEDLINGS;
  const p = g.plant(lane, col, species);
  if (typeof p === 'string') throw new Error(p);
  p.age = SPECIES[species].growMs;
  p.grown = true;
  p.hp = SPECIES[species].hp[1];
  return p;
}

describe('the schedule', () => {
  it.each(LEVEL_IDS)('%s has five rougher and rougher tides, then a surge in every lane', (lvl) => {
    const s = makeSchedule(lvl, seededRng(3));
    const spec = LEVELS[lvl];
    expect(s).toHaveLength(spec.tides.reduce((a, b) => a + b, 0) + LANES);
    expect(s[0]!.at).toBeGreaterThanOrEqual(FIRST_TIDE_MS);
    expect(s.every((w, i) => i === 0 || w.at >= s[i - 1]!.at)).toBe(true);
    expect(s[0]!.kind).toBe('ripple');
    const surge = s.slice(-LANES);
    expect(new Set(surge.map((w) => w.lane)).size).toBe(LANES);
    expect(surge.every((w) => w.kind === spec.surge)).toBe(true);
  });
});

describe('planting', () => {
  it('costs seedlings and needs a clear, empty spot', () => {
    const g = quiet();
    expect(g.seedlings).toBe(START_SEEDLINGS);
    const p = g.plant(2, 3, 'bakau');
    expect(p).toMatchObject({ lane: 2, col: 3, grown: false, hp: SPECIES.bakau.hp[0] });
    expect(g.seedlings).toBe(START_SEEDLINGS - SPECIES.bakau.cost);
    expect(g.plant(2, 3, 'api-api')).toBe('taken');
    expect(g.plant(1, 1, 'bakau')).toBe('cost');
    g.rubbish.add('0,0');
    expect(g.plant(0, 0, 'api-api')).toBe('rubbish');
    expect(g.plant(0, COLS, 'api-api')).toBe('taken');
  });

  it('grows up, then drops seedlings and shelters fish', () => {
    const g = quiet();
    g.seedlings = 2;
    const p = g.plant(0, 0, 'api-api') as Exclude<ReturnType<Guard['plant']>, string>;
    const events = run(g, SPECIES['api-api'].growMs + Math.max(DROP_MS, FISH_MS) + 200);
    expect(events).toContainEqual({ kind: 'grown', plant: p });
    expect(p.hp).toBe(SPECIES['api-api'].hp[1]);
    expect(events).toContainEqual({ kind: 'drop', plant: p });
    expect(events).toContainEqual({ kind: 'fish', plant: p });
    expect(g.fish).toBeGreaterThan(0);
  });

  it('earns a seedling from the village nursery now and then, up to a limit', () => {
    const g = quiet();
    g.seedlings = 0;
    run(g, INCOME_MS * 3, 50);
    expect(g.seedlings).toBe(3);
    g.seedlings = MAX_SEEDLINGS;
    run(g, INCOME_MS * 2);
    expect(g.seedlings).toBe(MAX_SEEDLINGS);
  });
});

describe('waves', () => {
  it('flood the village when nothing stands in the way', () => {
    const g = quiet();
    send(g, 1, 'ripple');
    const events = run(g, 12_000);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'flood', houses: 1 }));
    expect(g.houses).toBe(HOUSES - 1);
    expect(g.flooded.has(1)).toBe(true);
  });

  it('big waves flood two houses’ worth', () => {
    const g = quiet();
    send(g, 0, 'storm');
    run(g, 12_000);
    expect(g.houses).toBe(HOUSES - 2);
  });

  it('lose strength in each mangrove, which takes damage', () => {
    const g = quiet();
    const front = grown(g, 3, COLS - 1, 'bakau');
    const back = grown(g, 3, 2, 'api-api');
    front.healIn = back.healIn = 1e9;
    send(g, 3, 'storm');
    const events = run(g, 12_000);
    const hits = events.filter((e) => e.kind === 'hit');
    expect(hits).toHaveLength(2);
    // Storm 11: the bakau takes 5 off (6 left), then the api-api 3 (3 left): it still floods.
    expect(front.hp).toBe(SPECIES.bakau.hp[1] - 6);
    expect(back.hp).toBe(SPECIES['api-api'].hp[1] - 3);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'flood', houses: 1 }));
  });

  it('break for points when the mangroves take all their strength', () => {
    const g = quiet();
    grown(g, 2, 5, 'bakau');
    send(g, 2, 'wave');
    const events = run(g, 6000);
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'broken', col: 5, points: WAVE_ENERGY.wave * WAVE_POINTS }),
    );
    expect(g.waves).toHaveLength(0);
    expect(g.houses).toBe(HOUSES);
    expect(g.broken).toBe(1);
  });

  it('uproot young mangroves', () => {
    const g = quiet();
    g.seedlings = 10;
    g.plant(4, 6, 'api-api');
    send(g, 4, 'big');
    const events = run(g, 3000);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'hit', uprooted: true }));
    expect(g.plantAt(4, 6)).toBeUndefined();
  });

  it('can leave rubbish in the roots, which stops a mangrove growing until cleared', () => {
    const g = hush(new Guard('hard', () => 0)); // always leaves rubbish
    const p = grown(g, 0, 6, 'bakau');
    send(g, 0, 'ripple');
    const events = run(g, 3000);
    expect(events).toContainEqual({ kind: 'rubbish', lane: 0, col: 6 });
    expect(g.hasRubbish(0, 6)).toBe(true);
    const fishBefore = g.fish;
    run(g, FISH_MS * 2);
    expect(g.fish).toBe(fishBefore);
    const score = g.score;
    expect(g.clearRubbish(0, 6)).toBe(true);
    expect(g.clearRubbish(0, 6)).toBe(false);
    expect(g.score).toBe(score + CLEAR_POINTS);
    expect(p.hp).toBeGreaterThan(0);
  });
});

describe('the end', () => {
  it('is safe once every wave is gone, with points for each dry house', () => {
    const g = new Guard('easy', seededRng(1), { short: true });
    for (let lane = 0; lane < LANES; lane++) grown(g, lane, 6, 'api-api');
    const events = run(g, 20_000);
    expect(g.ended).toBe('safe');
    expect(events.at(-1)).toEqual({ kind: 'end', reason: 'safe' });
    expect(g.broken).toBe(LANES);
    expect(g.score).toBeGreaterThanOrEqual(HOUSES * HOUSE_POINTS + LANES * 2 * WAVE_POINTS);
    expect(g.tick(100)).toEqual([]);
    expect(g.plant(0, 0, 'api-api')).toBe('over');
  });

  it('is over when every house has flooded', () => {
    const g = new Guard('normal', seededRng(2));
    const events = run(g, 200_000);
    expect(g.ended).toBe('flooded');
    expect(g.houses).toBe(0);
    expect(events.at(-1)).toEqual({ kind: 'end', reason: 'flooded' });
  });

  it('announces each tide, and the storm surge', () => {
    const g = new Guard('normal', seededRng(4));
    for (let lane = 0; lane < LANES; lane++)
      for (let col = 0; col < COLS; col++) grown(g, lane, col, 'bakau');
    const tides = run(g, 200_000).filter((e) => e.kind === 'tide');
    expect(tides.map((e) => e.kind === 'tide' && e.tide)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(tides.at(-1)).toEqual({ kind: 'tide', tide: 5, surge: true });
    expect(g.ended).toBe('safe');
  });

  it('is deterministic for a seed', () => {
    const play = () => {
      const g = new Guard('hard', seededRng(8));
      for (let i = 0; i < 1500; i++) {
        g.tick(100);
        if (i % 30 === 0) g.plant(i % LANES, (i / 30) % COLS, 'api-api');
      }
      return [g.houses, g.score, g.plants.length, [...g.rubbish]];
    };
    expect(play()).toEqual(play());
  });

  it('gives stars for dry houses', () => {
    expect(guardStars(5, 'safe')).toBe(3);
    expect(guardStars(3, 'safe')).toBe(2);
    expect(guardStars(1, 'safe')).toBe(1);
    expect(guardStars(0, 'flooded')).toBe(0);
  });
});

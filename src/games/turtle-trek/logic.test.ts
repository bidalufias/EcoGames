import { describe, expect, it } from 'vitest';
import { TURTLE_FACTS } from '../../content/turtles';
import { seededRng } from '../../core/random';
import {
  CLEAN_BONUS,
  COLS,
  HATCHLINGS,
  LEVELS,
  LIGHT_COLS,
  NEST_COL,
  PULL_MS,
  ROWS,
  SAVE_POINTS,
  TIME_POINTS,
  TREK_MS,
  Trek,
  WAVE_EVERY,
  trekFacts,
  trekStars,
  type Dir,
  type Level,
  type TrekEvent,
} from './logic';

const LEVEL_IDS = Object.keys(LEVELS) as Level[];

/** A calm trek (no crabs, lights off) so tests can walk freely. */
function calm(seed = 1, trekMs?: number): Trek {
  const t = new Trek('easy', seededRng(seed), { calm: true, trekMs });
  for (const l of t.lights) {
    l.on = false;
    l.offLeft = 1e9;
  }
  t.rubbish.clear();
  return t;
}

/** Walks straight down to the sea. */
function walkDown(t: Trek): TrekEvent[] {
  const events: TrekEvent[] = [];
  for (let i = 0; i < ROWS - 1; i++) events.push(...t.step('down'));
  return events;
}

describe('Trek setup', () => {
  it.each(LEVEL_IDS)('%s lays out the beach from nest to sea', (lvl) => {
    const t = new Trek(lvl, seededRng(2));
    expect(t.lanes).toHaveLength(ROWS);
    expect(t.lanes[0]).toBe('nest');
    expect(t.lanes.at(-1)).toBe('sea');
    expect(t.lanes.at(-2)).toBe('wet');
    const crabRows = t.lanes.filter((l) => l === 'crabs').length;
    expect(t.crabs).toHaveLength(crabRows * LEVELS[lvl].crabsPerLane);
    expect(t.lights.filter((l) => l.on)).toHaveLength(LEVELS[lvl].lightsOn);
    expect(t.hatchling).toEqual({ row: 0, col: NEST_COL });
    expect(t.left).toBe(HATCHLINGS);
  });

  it('always leaves gaps in the rubbish', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const t = new Trek('hard', seededRng(seed));
      t.lanes.forEach((lane, row) => {
        if (lane !== 'rubbish') return;
        const blocked = Array.from({ length: COLS }, (_, col) => !!t.rubbishAt({ row, col }));
        expect(blocked.filter(Boolean).length).toBeGreaterThanOrEqual(3);
        expect(blocked.filter((b) => !b).length).toBeGreaterThanOrEqual(4);
      });
    }
  });
});

describe('moving', () => {
  it('steps one cell at a time and not off the beach', () => {
    const t = calm();
    expect(t.step('up')).toEqual([]);
    expect(t.hatchling).toEqual({ row: 0, col: NEST_COL });
    t.step('down');
    t.step('left');
    expect(t.hatchling).toEqual({ row: 1, col: NEST_COL - 1 });
    for (let i = 0; i < COLS; i++) t.step('left');
    expect(t.hatchling.col).toBe(0);
  });

  it('cannot crawl through rubbish', () => {
    const t = calm();
    t.rubbish.set(`1,${NEST_COL}`, { id: 'x', name: 'Tin can', image: 'tin', fact: 'x' });
    expect(t.step('down')).toEqual([expect.objectContaining({ kind: 'blocked' })]);
    expect(t.hatchling.row).toBe(0);
  });

  it('saves a hatchling that reaches the sea, then sends out the next one', () => {
    const t = calm();
    const events = walkDown(t);
    expect(events).toContainEqual({
      kind: 'saved',
      clean: true,
      points: SAVE_POINTS + CLEAN_BONUS,
      byWave: false,
    });
    expect(t.saved).toBe(1);
    expect(t.hatchling).toEqual({ row: 0, col: NEST_COL });
    expect(t.left).toBe(HATCHLINGS - 1);
  });

  it('ends early with a time bonus when the whole nest is safe', () => {
    const t = calm();
    for (let i = 0; i < HATCHLINGS; i++) walkDown(t);
    expect(t.ended).toBe('all-safe');
    expect(t.left).toBe(0);
    const bonus = Math.floor(TREK_MS / 1000) * TIME_POINTS;
    expect(t.score).toBe(HATCHLINGS * (SAVE_POINTS + CLEAN_BONUS) + bonus);
    expect(t.step('down')).toEqual([]);
  });
});

describe('dangers', () => {
  it('a crab scares the hatchling back to the nest, and it loses its clean bonus', () => {
    const t = calm();
    t.step('down');
    t.crabs.push({ row: 2, x: NEST_COL, speed: 0 });
    expect(t.step('down')).toEqual([{ kind: 'scared' }]);
    expect(t.hatchling).toEqual({ row: 0, col: NEST_COL });
    expect(t.scares).toBe(1);
    t.crabs.length = 0;
    const events = walkDown(t);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'saved', clean: false }));
    expect(t.score).toBe(SAVE_POINTS);
  });

  it('a crab walking into a hatchling that is waiting scares it too', () => {
    const t = calm();
    t.step('down');
    t.crabs.push({ row: 1, x: NEST_COL - 2, speed: 2 });
    let scared = false;
    for (let i = 0; i < 40 && !scared; i++) scared = t.tick(50).some((e) => e.kind === 'scared');
    expect(scared).toBe(true);
  });

  it('a lit light pulls a nearby hatchling back towards it, until switched off', () => {
    const t = calm();
    const light = t.lights[0]!;
    light.on = true;
    t.step('down');
    t.step('down');
    t.step('left');
    const before = { ...t.hatchling };
    const events: TrekEvent[] = [];
    for (let i = 0; i <= PULL_MS / 50; i++) events.push(...t.tick(50));
    expect(events).toContainEqual({ kind: 'pulled', light });
    const moved = t.hatchling.row < before.row || t.hatchling.col < before.col;
    expect(moved).toBe(true);
    expect(t.switchOff()).toBe(light);
    expect(light.on).toBe(false);
    const after = { ...t.hatchling };
    for (let i = 0; i <= (PULL_MS * 2) / 50; i++) t.tick(50);
    expect(t.hatchling).toEqual(after);
  });

  it('switched-off lights come back on after a while', () => {
    const t = new Trek('hard', seededRng(3), { calm: true });
    const lit = t.lights.filter((l) => l.on);
    expect(lit.length).toBeGreaterThan(0);
    const off = t.switchOff(lit[0]!.col)!;
    expect(off.on).toBe(false);
    const events: TrekEvent[] = [];
    for (let i = 0; i < LEVELS.hard.lightOff[1] / 100 + 1; i++) events.push(...t.tick(100));
    expect(events).toContainEqual({ kind: 'light-on', light: off });
    expect(LIGHT_COLS).toContain(off.col);
  });

  it('a wave carries a hatchling on the wet sand out to sea', () => {
    const t = calm();
    for (let i = 0; i < ROWS - 2; i++) t.step('down');
    expect(t.lanes[t.hatchling.row]).toBe('wet');
    const events: TrekEvent[] = [];
    for (let i = 0; i <= WAVE_EVERY / 100; i++) events.push(...t.tick(100));
    expect(events).toContainEqual(expect.objectContaining({ kind: 'saved', byWave: true }));
  });
});

describe('the end and scoring', () => {
  it('ends at sunrise', () => {
    const t = calm(1, 1000);
    const events: TrekEvent[] = [];
    for (let i = 0; i < 30; i++) events.push(...t.tick(50));
    expect(t.ended).toBe('sunrise');
    expect(events.at(-1)).toEqual({ kind: 'end', reason: 'sunrise' });
    expect(t.tick(50)).toEqual([]);
  });

  it('is deterministic for a seed', () => {
    const run = () => {
      const t = new Trek('normal', seededRng(9));
      const dirs: Dir[] = ['down', 'down', 'left', 'down', 'right'];
      for (let i = 0; i < 400; i++) {
        t.tick(50);
        if (i % 3 === 0) t.step(dirs[i % dirs.length]!);
      }
      return [t.hatchling, t.saved, t.scares, t.crabs.map((c) => c.x)];
    };
    expect(run()).toEqual(run());
  });

  it('gives stars for how many hatchlings reached the sea', () => {
    expect([0, 2, 3, 5, 7, 8].map((n) => trekStars(n))).toEqual([0, 1, 1, 2, 2, 3]);
  });

  it('shows a different set of facts each time', () => {
    const a = trekFacts(0, 3);
    const b = trekFacts(a.next, 3);
    expect(a.picked).toHaveLength(3);
    expect(b.picked[0]).not.toEqual(a.picked[0]);
    expect(trekFacts(TURTLE_FACTS.length - 1, 2).picked[1]).toEqual(TURTLE_FACTS[0]);
  });
});

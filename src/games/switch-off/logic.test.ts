import { describe, expect, it } from 'vitest';
import { APPLIANCES, ROOMS } from '../../content/energy';
import { seededRng } from '../../core/random';
import {
  DAY_MS,
  HouseDay,
  LEVELS,
  MAX_MISTAKES,
  METER_MAX,
  learnedFrom,
  meterBonus,
  streakBonus,
  switchStars,
  type Level,
} from './logic';

const LEVEL_IDS = Object.keys(LEVELS) as Level[];

/** An appliance that is on in a room nobody is in, if there is one. */
const wasted = (d: HouseDay) => d.appliances.find((a) => d.isOn(a.id) && !d.occupied(a.room));
/** An appliance that is on in a room someone is in. */
const inUse = (d: HouseDay) => d.appliances.find((a) => d.isOn(a.id) && d.occupied(a.room));

/** Switches off everything left on in empty rooms. */
function tidy(d: HouseDay): void {
  for (let a = wasted(d); a; a = wasted(d)) d.press(a.id);
}

describe('HouseDay setup', () => {
  it.each(LEVEL_IDS)('%s starts with the family in different rooms and waste to find', (lvl) => {
    const d = new HouseDay(lvl, seededRng(1));
    expect(d.people).toHaveLength(LEVELS[lvl].people);
    expect(new Set(d.people.map((p) => p.room)).size).toBe(d.people.length);
    for (const p of d.people) expect(d.peopleIn(p.room).length).toBeGreaterThan(0);
    // Every occupied room has something on, and one empty room has something left on.
    for (const r of ROOMS) {
      if (d.occupied(r.id))
        expect(APPLIANCES.some((a) => a.room === r.id && d.isOn(a.id))).toBe(true);
    }
    expect(wasted(d)).toBeDefined();
    expect(d.wastePower()).toBeGreaterThan(0);
  });

  it('is deterministic for a seed', () => {
    const run = (seed: number) => {
      const d = new HouseDay('normal', seededRng(seed));
      const log: string[] = [];
      for (let i = 0; i < 300 && !d.finished; i++) {
        for (const e of d.tick(100))
          log.push(e.kind === 'move' ? `${e.person.name}>${e.to}` : e.reason);
      }
      return { log, on: [...d.on].sort(), meter: d.meter };
    };
    expect(run(42)).toEqual(run(42));
    expect(run(42).log).not.toEqual(run(43).log);
  });
});

describe('moving around', () => {
  it('moves people to another room and switches things on there', () => {
    const d = new HouseDay('easy', seededRng(5));
    const first = d.people[0]!;
    const from = first.room;
    const events = d.tick(first.nextMove);
    const move = events.find((e) => e.kind === 'move' && e.person === first);
    expect(move).toBeDefined();
    if (move?.kind !== 'move') return;
    expect(move.from).toBe(from);
    expect(move.to).not.toBe(from);
    expect(first.room).toBe(move.to);
    expect(first.nextMove).toBeGreaterThanOrEqual(LEVELS.easy.stay[0]);
    for (const a of move.switchedOn) {
      expect(a.room).toBe(move.to);
      expect(d.isOn(a.id)).toBe(true);
    }
  });

  it('leaves things on when people walk out, which fills the meter', () => {
    const d = new HouseDay('normal', seededRng(9));
    tidy(d);
    expect(d.wastePower()).toBe(0);
    const before = d.meter;
    d.tick(1000);
    expect(d.meter).toBe(before);
    // Wait for someone to leave a room behind with things on.
    for (let i = 0; i < 200 && d.wastePower() === 0; i++) d.tick(100);
    const waste = d.wastePower();
    expect(waste).toBeGreaterThan(0);
    const meter = d.meter;
    const events = d.tick(1);
    expect(events.every((e) => e.kind !== 'end')).toBe(true);
    expect(d.meter - meter).toBeCloseTo((waste * LEVELS.normal.meterRate) / 1000);
  });

  it('fills the meter faster on harder levels', () => {
    expect(LEVELS.easy.meterRate).toBeLessThan(LEVELS.normal.meterRate);
    expect(LEVELS.normal.meterRate).toBeLessThan(LEVELS.hard.meterRate);
    expect(LEVELS.hard.stay[1]).toBeLessThan(LEVELS.easy.stay[0]);
    expect(LEVELS.easy.people).toBeLessThanOrEqual(LEVELS.hard.people);
  });
});

describe('pressing switches', () => {
  it('switches off things in empty rooms for points by power', () => {
    const d = new HouseDay('easy', seededRng(3));
    const a = wasted(d)!;
    const out = d.press(a.id);
    expect(out).toMatchObject({ kind: 'off', points: a.power * 10, streak: 1 });
    expect(d.isOn(a.id)).toBe(false);
    expect(d.score).toBe(a.power * 10);
    expect(d.offCounts.get(a.id)).toBe(1);
    // Pressing something already off does nothing.
    expect(d.press(a.id).kind).toBe('ignored');
    expect(d.press('no-such-thing').kind).toBe('ignored');
  });

  it('counts a mistake when someone is using it, and leaves it on', () => {
    const d = new HouseDay('easy', seededRng(3));
    tidy(d);
    expect(d.streak).toBeGreaterThan(0);
    const a = inUse(d)!;
    const out = d.press(a.id);
    expect(out).toMatchObject({ kind: 'mistake', mistakes: 1, gameOver: false });
    expect(d.isOn(a.id)).toBe(true);
    expect(d.streak).toBe(0);
    expect(d.mistakeIds).toEqual([a.id]);
  });

  it('ends the day after three mistakes', () => {
    const d = new HouseDay('normal', seededRng(11));
    const a = inUse(d)!;
    let out;
    for (let i = 0; i < MAX_MISTAKES; i++) out = d.press(a.id);
    expect(out).toMatchObject({ kind: 'mistake', gameOver: true });
    expect(d.ended).toBe('mistakes');
    expect(d.survived).toBe(false);
    expect(d.tick(1000)).toEqual([]);
    expect(d.press(a.id).kind).toBe('ignored');
    expect(d.finalScore).toBe(d.score);
  });
});

describe('end of the day', () => {
  it('ends with a full meter when nobody switches anything off', () => {
    for (const lvl of LEVEL_IDS) {
      const d = new HouseDay(lvl, seededRng(7));
      let last: ReturnType<HouseDay['tick']> = [];
      while (!d.finished) last = d.tick(100);
      expect(d.ended, lvl).toBe('meter');
      expect(last.at(-1)).toEqual({ kind: 'end', reason: 'meter' });
      expect(d.meter).toBe(METER_MAX);
      expect(d.elapsed).toBeLessThan(DAY_MS);
    }
  });

  it('survives the day with a quick player and scores the meter bonus', () => {
    for (const lvl of LEVEL_IDS) {
      const d = new HouseDay(lvl, seededRng(21));
      while (!d.finished) {
        d.tick(250);
        tidy(d);
      }
      expect(d.ended, lvl).toBe('time');
      expect(d.survived).toBe(true);
      expect(d.elapsed).toBe(DAY_MS);
      expect(d.timeLeft).toBe(0);
      expect(d.switchedOff).toBeGreaterThan(3);
      expect(d.bestStreak).toBe(d.switchedOff);
      expect(d.finalScore).toBe(d.score + meterBonus(d.meter));
      expect(switchStars(true, d.meter, d.switchedOff), lvl).toBe(3);
    }
  });

  it('does not run past the end of the day on a long tick', () => {
    const d = new HouseDay('easy', seededRng(2));
    tidy(d);
    d.tick(DAY_MS - 10);
    if (!d.finished) d.tick(5000);
    expect(d.elapsed).toBeLessThanOrEqual(DAY_MS);
    expect(d.finished).toBe(true);
  });
});

describe('scoring', () => {
  it('adds a streak bonus that grows and caps', () => {
    expect([1, 2, 3, 5, 6, 9, 30].map(streakBonus)).toEqual([0, 0, 5, 5, 10, 15, 15]);
  });

  it('gives a bigger meter bonus for a lower bill', () => {
    expect(meterBonus(0)).toBe(100);
    expect(meterBonus(25)).toBe(75);
    expect(meterBonus(METER_MAX)).toBe(0);
    expect(meterBonus(METER_MAX * 2)).toBe(0);
  });

  it('gives stars mainly for a low meter', () => {
    expect(switchStars(true, 10, 5)).toBe(3);
    expect(switchStars(true, 50, 5)).toBe(2);
    expect(switchStars(true, 90, 5)).toBe(1);
    expect(switchStars(false, 40, 5)).toBe(1);
    expect(switchStars(false, 100, 0)).toBe(0);
  });
});

describe('learnedFrom', () => {
  it('lists mistakes first, then the most switched off, one per tip', () => {
    const d = new HouseDay('easy', seededRng(3));
    d.mistakeIds.push('aircon');
    d.offCounts.set('bedroom-light', 1);
    d.offCounts.set('kitchen-light', 4);
    d.offCounts.set('water-heater', 2);
    d.offCounts.set('tv', 1);
    d.offCounts.set('console', 1);
    d.offCounts.set('kettle', 1);
    const ids = learnedFrom(d).map((a) => a.id);
    expect(ids).toHaveLength(4);
    expect(ids.slice(0, 3)).toEqual(['aircon', 'kitchen-light', 'water-heater']);
    expect(ids).not.toContain('bedroom-light');
  });

  it('is empty when the player met nothing', () => {
    expect(learnedFrom(new HouseDay('easy', seededRng(1)))).toEqual([]);
  });
});

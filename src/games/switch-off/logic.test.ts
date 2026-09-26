import { describe, expect, it } from 'vitest';
import { APPLIANCES, FAMILY, ROOMS, type RoomId } from '../../content/energy';
import { seededRng } from '../../core/random';
import {
  DAY_MS,
  FLOOR_PLAN,
  HouseDay,
  LEVELS,
  METER_MAX,
  OOPS_PENALTY,
  PLAYER_SPEED,
  Walker,
  learnedFrom,
  meterBonus,
  streakBonus,
  switchStars,
  type DayEvent,
  type Level,
  type Tile,
} from './logic';

const LEVEL_IDS = Object.keys(LEVELS) as Level[];
const plan = FLOOR_PLAN;
const key = (t: Tile) => `${t.x},${t.y}`;

/** Runs the day for `ms` in 50 ms frames, collecting events. */
function run(d: HouseDay, ms: number): DayEvent[] {
  const events: DayEvent[] = [];
  for (let t = 0; t < ms && !d.finished; t += 50) events.push(...d.tick(50));
  return events;
}

/** Puts a walker on a tile, standing still. */
function place(w: Walker, t: Tile): void {
  w.x = t.x;
  w.y = t.y;
  w.path = [];
}

/** Keeps a family member busy in a room for the rest of the test. */
function park(d: HouseDay, index: number, room: RoomId): void {
  const p = d.people[index]!;
  place(p, plan.roomTiles(room)[0]!);
  p.target = d.appliancesIn(room)[0]!.id;
  p.useLeft = 1e9;
}

/** Sends everyone to the bathroom so the other rooms are empty. */
function parkEveryone(d: HouseDay): void {
  d.people.forEach((_, i) => park(d, i, 'bathroom'));
}

describe('floor plan', () => {
  it('has four rooms and a hallway joined by doorways', () => {
    expect(plan.doors).toHaveLength(4);
    for (const r of ROOMS) expect(plan.roomTiles(r.id).length, r.id).toBeGreaterThanOrEqual(8);
    expect(plan.areaAt(plan.start)).toBe('hall');
    expect(plan.roomAt(plan.start)).toBeNull();
  });

  it('lets you walk from the start to every bit of floor', () => {
    for (let y = 0; y < plan.height; y++)
      for (let x = 0; x < plan.width; x++) {
        const t = { x, y };
        if (plan.isWalkable(t)) expect(plan.path(plan.start, t), key(t)).not.toBeNull();
      }
  });

  it('puts every appliance and piece of furniture inside its own room', () => {
    for (const a of APPLIANCES) {
      const at = plan.applianceTiles[a.id]!;
      expect(plan.roomAt(at), a.id).toBe(a.room);
      expect(plan.isWalkable(at), a.id).toBe(false);
      const spot = plan.spotFor(a.id, a.room);
      expect(plan.isWalkable(spot), a.id).toBe(true);
      expect(plan.roomAt(spot), a.id).toBe(a.room);
      expect(Math.abs(spot.x - at.x) + Math.abs(spot.y - at.y), a.id).toBe(1);
    }
    for (const f of plan.furniture) {
      const corner = { x: Math.round(f.x), y: Math.round(f.y) };
      expect(plan.areaAt(corner), `${f.kind} at ${key(f)}`).not.toBeNull();
    }
  });

  it('keeps the tiles either side of every doorway free', () => {
    for (const d of plan.doors) {
      const sides = [
        { x: d.x - 1, y: d.y },
        { x: d.x + 1, y: d.y },
        { x: d.x, y: d.y - 1 },
        { x: d.x, y: d.y + 1 },
      ].filter((t) => !plan.isWall(t));
      expect(sides).toHaveLength(2);
      for (const t of sides) expect(plan.isWalkable(t), key(t)).toBe(true);
    }
  });

  it('finds walks between every pair of rooms, one tile at a time through doorways', () => {
    for (const from of ROOMS)
      for (const to of ROOMS) {
        const a = plan.roomTiles(from.id)[0]!;
        const b = plan.roomTiles(to.id).at(-1)!;
        const path = plan.path(a, b);
        expect(path, `${from.id} → ${to.id}`).not.toBeNull();
        let prev = a;
        for (const t of path!) {
          expect(Math.abs(t.x - prev.x) + Math.abs(t.y - prev.y)).toBe(1);
          expect(plan.isWalkable(t)).toBe(true);
          prev = t;
        }
        expect(prev).toEqual(b);
        if (from.id !== to.id) expect(path!.some((t) => plan.isDoor(t))).toBe(true);
      }
  });

  it('cannot walk into walls or furniture', () => {
    expect(plan.path({ x: 1, y: 2 }, { x: 0, y: 2 })).toBeNull();
    expect(plan.path({ x: 1, y: 2 }, { x: 2, y: 1 })).toBeNull(); // the bed
    expect(plan.path({ x: 1, y: 2 }, { x: 1, y: 2 })).toEqual([]);
  });

  it('snaps taps on walls to the nearest floor', () => {
    const t = plan.nearestWalkable({ x: 0, y: 3 });
    expect(t).toEqual({ x: 1, y: 3 });
    expect(plan.nearestWalkable({ x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
  });
});

describe('Walker', () => {
  it('walks at its speed and stops at the end of the path', () => {
    const w = new Walker(FAMILY[0]!, { x: 1, y: 1 }, 2);
    w.setPath([
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ]);
    expect(w.advance(250)).toBe(false);
    expect(w.x).toBeCloseTo(1.5);
    expect(w.advance(1000)).toBe(true);
    expect({ x: w.x, y: w.y }).toEqual({ x: 3, y: 1 });
    expect(w.moving).toBe(false);
    expect(w.dir).toBe('right');
  });

  it('goes back to the middle of its tile before turning, so it never cuts a corner', () => {
    const w = new Walker(FAMILY[0]!, { x: 2, y: 2 }, 2);
    w.setPath([{ x: 3, y: 2 }]);
    w.advance(200); // x = 2.4, still on tile 2
    w.setPath([{ x: 2, y: 3 }]);
    expect(w.path[0]).toEqual({ x: 2, y: 2 });
    w.advance(200);
    expect(w.x).toBeCloseTo(2);
    expect(w.y).toBe(2);
    w.advance(1000);
    expect({ x: w.x, y: w.y }).toEqual({ x: 2, y: 3 });
    expect(w.dir).toBe('down');
  });
});

describe('HouseDay setup', () => {
  it.each(LEVEL_IDS)('%s starts the family in different rooms, with a job to do', (lvl) => {
    const d = new HouseDay(lvl, seededRng(1));
    expect(d.people).toHaveLength(LEVELS[lvl].people);
    const rooms = d.people.map((p) => d.roomOf(p));
    expect(new Set(rooms).size).toBe(d.people.length);
    expect(d.people.every((p) => p.target !== null)).toBe(true);
    if (d.people.length < ROOMS.length) {
      expect(d.appliances.some((a) => d.isWasted(a))).toBe(true);
    }
    expect(d.player.tile).toEqual(plan.start);
  });

  it('is deterministic for a seed', () => {
    const a = new HouseDay('normal', seededRng(9));
    const b = new HouseDay('normal', seededRng(9));
    run(a, 20_000);
    run(b, 20_000);
    expect([...a.on].sort()).toEqual([...b.on].sort());
    expect(a.people.map((p) => p.tile)).toEqual(b.people.map((p) => p.tile));
    expect(a.meter).toBe(b.meter);
  });
});

describe('the family', () => {
  it('walks around switching things on, and leaves rooms with things still on', () => {
    const d = new HouseDay('normal', seededRng(3));
    const events = run(d, 30_000);
    const on = events.filter((e) => e.kind === 'on');
    const left = events.filter((e) => e.kind === 'left-on');
    expect(on.length).toBeGreaterThan(3);
    expect(left.length).toBeGreaterThan(0);
    const visited = new Set(on.map((e) => (e.kind === 'on' ? e.appliance.room : null)));
    expect(visited.size).toBeGreaterThan(1);
    // Someone who switches something on is standing next to it.
    for (const e of on) {
      if (e.kind !== 'on') continue;
      expect(e.person.name).toBeTruthy();
    }
  });

  it('only switches things on while standing next to them', () => {
    const d = new HouseDay('hard', seededRng(4));
    for (let t = 0; t < 20_000; t += 50) {
      for (const e of d.tick(50)) {
        if (e.kind !== 'on') continue;
        const at = plan.applianceTiles[e.appliance.id]!;
        const p = e.person.tile;
        expect(Math.abs(p.x - at.x) + Math.abs(p.y - at.y)).toBe(1);
      }
    }
  });
});

describe('the player', () => {
  it('steps one tile at a time and not through walls', () => {
    const d = new HouseDay('easy', seededRng(1));
    place(d.player, { x: 4, y: 2 });
    expect(d.step('up')).toBe(false); // the bedside table
    expect(d.step('left')).toBe(false); // the bed
    expect(d.player.dir).toBe('left');
    expect(d.step('down')).toBe(true);
    expect(d.step('down')).toBe(false); // still walking
    run(d, 1000 / PLAYER_SPEED + 50);
    expect(d.player.tile).toEqual({ x: 4, y: 3 });
    place(d.player, { x: 1, y: 3 });
    expect(d.step('left')).toBe(false); // the wall
  });

  it('walks to a tapped spot', () => {
    const d = new HouseDay('easy', seededRng(1));
    d.walkTo({ x: 16, y: 10 });
    run(d, 6000);
    expect(d.player.tile).toEqual({ x: 16, y: 10 });
  });

  it('walks over and switches off something left on in an empty room', () => {
    const d = new HouseDay('easy', seededRng(2));
    parkEveryone(d);
    d.on.add('kettle');
    expect(d.goSwitch('kettle')).toBeNull();
    expect(d.heading).toBe('kettle');
    const events = run(d, 8000);
    const press = events.find((e) => e.kind === 'press');
    expect(press).toEqual({
      kind: 'press',
      outcome: expect.objectContaining({ kind: 'off', points: 20, streak: 1 }),
    });
    expect(d.isOn('kettle')).toBe(false);
    expect(d.score).toBe(20);
  });

  it('switches off straight away when already in reach, and Space picks what is on', () => {
    const d = new HouseDay('easy', seededRng(2));
    parkEveryone(d);
    d.on.add('tv');
    d.on.add('console');
    place(d.player, plan.spotFor('tv', 'living'));
    expect(d.inReach('tv')).toBe(true);
    expect(d.reachable()?.id).toBe('tv');
    expect(d.goSwitch('tv')).toMatchObject({ kind: 'off', points: 20 });
    expect(d.player.dir).toBe('left');
    expect(d.inReach('console')).toBe(true); // on the same TV unit
    expect(d.interact()).toMatchObject({ kind: 'off', appliance: { id: 'console' } });
    expect(d.interact()).toMatchObject({ kind: 'ignored' });
    expect(d.inReach('living-light')).toBe(false);
  });

  it('only reaches things in the room it is standing in', () => {
    const d = new HouseDay('easy', seededRng(2));
    place(d.player, { x: 10, y: 2 });
    expect(d.inReach('bathroom-light')).toBe(true);
    for (const t of [...plan.doors, plan.start]) {
      place(d.player, t);
      for (const a of APPLIANCES) expect(d.inReach(a.id), `${a.id} from ${key(t)}`).toBe(false);
    }
  });

  it('loses points and the streak for switching off something in use', () => {
    const d = new HouseDay('easy', seededRng(2));
    parkEveryone(d);
    d.on.add('kettle');
    d.on.add('water-heater');
    place(d.player, plan.spotFor('kettle', 'kitchen'));
    d.interact();
    expect(d.streak).toBe(1);
    place(d.player, plan.spotFor('water-heater', 'bathroom'));
    const outcome = d.interact();
    expect(outcome).toMatchObject({ kind: 'oops', penalty: OOPS_PENALTY });
    expect(d.isOn('water-heater')).toBe(true);
    expect(d.streak).toBe(0);
    expect(d.score).toBe(20 - OOPS_PENALTY);
    expect(d.oops).toBe(1);
    // The score never goes below zero.
    d.interact();
    d.interact();
    expect(d.score).toBe(0);
  });

  it('does no harm when someone walks in while the player is on the way', () => {
    const d = new HouseDay('easy', seededRng(2));
    parkEveryone(d);
    d.on.add('rice-cooker');
    d.goSwitch('rice-cooker');
    park(d, 0, 'kitchen');
    const events = run(d, 8000);
    const press = events.find((e) => e.kind === 'press');
    expect(press).toMatchObject({ outcome: { kind: 'busy' } });
    expect(d.score).toBe(0);
    expect(d.oops).toBe(0);
    expect(d.isOn('rice-cooker')).toBe(true);
  });
});

describe('the bill and the end of the day', () => {
  it('counts only things left on in empty rooms as waste', () => {
    const d = new HouseDay('easy', seededRng(2));
    d.on.clear();
    parkEveryone(d);
    d.on.add('aircon'); // 3, bedroom is empty
    d.on.add('water-heater'); // 3, but someone is in the bathroom
    expect(d.wastePower()).toBe(3);
  });

  it('ends the day when the bill meter fills up', () => {
    const d = new HouseDay('hard', seededRng(5));
    const events = run(d, DAY_MS);
    expect(d.ended).toBe('meter');
    expect(d.meter).toBe(METER_MAX);
    expect(events.at(-1)).toEqual({ kind: 'end', reason: 'meter' });
    expect(d.survived).toBe(false);
    expect(d.finalScore).toBe(d.score);
  });

  it('ends when the day is over, with a bonus for a low bill', () => {
    const d = new HouseDay('easy', seededRng(5), { dayMs: 3000 });
    d.on.clear();
    parkEveryone(d);
    const events = run(d, 5000);
    expect(d.ended).toBe('time');
    expect(events.at(-1)).toEqual({ kind: 'end', reason: 'time' });
    expect(d.timeLeft).toBe(0);
    expect(d.finalScore).toBe(d.score + meterBonus(d.meter));
    expect(d.tick(50)).toEqual([]);
    expect(d.step('down')).toBe(false);
  });
});

describe('scoring', () => {
  it('gives a growing streak bonus, capped', () => {
    expect([0, 2, 3, 6, 9, 20].map(streakBonus)).toEqual([0, 0, 5, 10, 15, 15]);
  });

  it('gives more bonus the emptier the meter', () => {
    expect(meterBonus(0)).toBe(100);
    expect(meterBonus(25)).toBe(75);
    expect(meterBonus(150)).toBe(0);
  });

  it('gives stars mainly for a low bill', () => {
    expect(switchStars(true, 20, 5)).toBe(3);
    expect(switchStars(true, 50, 5)).toBe(2);
    expect(switchStars(true, 90, 5)).toBe(1);
    expect(switchStars(false, 100, 5)).toBe(1);
    expect(switchStars(false, 100, 0)).toBe(0);
    expect(switchStars(true, 10, 0)).toBe(1);
  });

  it('recaps tips from mistakes first, one per tip', () => {
    const d = new HouseDay('easy', seededRng(2));
    parkEveryone(d);
    for (const id of ['kitchen-light', 'bedroom-light', 'aircon']) {
      d.on.add(id);
      place(d.player, plan.spotFor(id, d.appliance(id)!.room));
      d.interact();
    }
    d.on.add('water-heater');
    place(d.player, plan.spotFor('water-heater', 'bathroom'));
    d.interact();
    const tips = learnedFrom(d);
    expect(tips[0]?.id).toBe('water-heater');
    expect(tips.map((t) => t.id)).toEqual(['water-heater', 'kitchen-light', 'aircon']);
  });
});

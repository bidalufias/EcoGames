import {
  APPLIANCES,
  FAMILY,
  ROOMS,
  type Appliance,
  type Room,
  type RoomId,
} from '../../content/energy';
import { sample, shuffle, type Rng } from '../../core/random';

export type Level = 'easy' | 'normal' | 'hard';

export interface LevelConfig {
  /** How many family members walk around the house. */
  people: number;
  /** Milliseconds a person stays in a room before moving (a random value in this range). */
  stay: [number, number];
  /** Meter filled per second for each unit of power left on in an empty room. */
  meterRate: number;
}

export const LEVELS: Record<Level, LevelConfig> = {
  easy: { people: 2, stay: [5000, 8000], meterRate: 0.3 },
  normal: { people: 3, stay: [4000, 6500], meterRate: 0.35 },
  hard: { people: 3, stay: [2800, 4500], meterRate: 0.45 },
};

export const DAY_MS = 60_000;
export const METER_MAX = 100;
export const MAX_MISTAKES = 3;
const POINTS_PER_POWER = 10;

/** Bonus for switch-offs in a row: +5 from 3 in a row, +10 from 6, +15 from 9. */
export function streakBonus(streak: number): number {
  return Math.min(Math.floor(streak / 3), 3) * 5;
}

/** Points for surviving the day: up to 100, more the emptier the bill meter. */
export function meterBonus(meter: number): number {
  return Math.round((1 - Math.min(meter, METER_MAX) / METER_MAX) * 100);
}

/** Stars come mainly from how low the bill meter ended. */
export function switchStars(survived: boolean, meter: number, switchedOff: number): number {
  if (!survived) return switchedOff > 0 ? 1 : 0;
  if (meter <= METER_MAX * 0.3) return 3;
  if (meter <= METER_MAX * 0.6) return 2;
  return 1;
}

export interface Person {
  name: string;
  room: RoomId;
  /** Milliseconds until this person moves to another room. */
  nextMove: number;
}

export type EndReason = 'time' | 'meter' | 'mistakes';

export type DayEvent =
  | { kind: 'move'; person: Person; from: RoomId; to: RoomId; switchedOn: Appliance[] }
  | { kind: 'end'; reason: EndReason };

export type PressOutcome =
  | { kind: 'off'; appliance: Appliance; points: number; streak: number }
  | { kind: 'mistake'; appliance: Appliance; mistakes: number; gameOver: boolean }
  | { kind: 'ignored' };

/** One day in the house: people moving, appliances left on and the bill meter. */
export class HouseDay {
  readonly config: LevelConfig;
  readonly rooms: readonly Room[];
  readonly appliances: readonly Appliance[];
  readonly people: Person[];
  /** Ids of the appliances that are on. */
  readonly on = new Set<string>();
  /** How many times the player switched off each appliance. */
  readonly offCounts = new Map<string, number>();
  /** Appliances the player tried to switch off while someone was using them. */
  readonly mistakeIds: string[] = [];
  elapsed = 0;
  meter = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  mistakes = 0;
  switchedOff = 0;
  ended: EndReason | null = null;
  private rng: Rng;

  constructor(
    level: Level,
    rng: Rng,
    rooms: readonly Room[] = ROOMS,
    appliances: readonly Appliance[] = APPLIANCES,
  ) {
    this.config = LEVELS[level];
    this.rng = rng;
    this.rooms = rooms;
    this.appliances = appliances;
    // Everyone starts in a different room and switches something on there.
    const start = shuffle(rooms, rng);
    this.people = FAMILY.slice(0, this.config.people).map((name, i) => {
      const room = (start[i % start.length] as Room).id;
      // Spread the first moves out so the family doesn't all move at once.
      return { name, room, nextMove: this.stayTime() + i * 700 };
    });
    for (const p of this.people) this.switchOnIn(p.room);
    // Something was left on this morning, so there is a job to do straight away.
    const empty = rooms.filter((r) => !this.occupied(r.id));
    const leftOn = empty[Math.floor(rng() * empty.length)];
    if (leftOn) this.switchOnIn(leftOn.id, 1);
  }

  get finished(): boolean {
    return this.ended !== null;
  }

  get survived(): boolean {
    return this.ended === 'time';
  }

  get timeLeft(): number {
    return Math.max(0, DAY_MS - this.elapsed);
  }

  /** Final score: switch-offs and streak bonuses, plus the meter bonus for surviving. */
  get finalScore(): number {
    return this.score + (this.survived ? meterBonus(this.meter) : 0);
  }

  appliance(id: string): Appliance | undefined {
    return this.appliances.find((a) => a.id === id);
  }

  peopleIn(room: RoomId): Person[] {
    return this.people.filter((p) => p.room === room);
  }

  occupied(room: RoomId): boolean {
    return this.people.some((p) => p.room === room);
  }

  isOn(id: string): boolean {
    return this.on.has(id);
  }

  /** Total power of the appliances left on in empty rooms. */
  wastePower(): number {
    let total = 0;
    for (const a of this.appliances) {
      if (this.on.has(a.id) && !this.occupied(a.room)) total += a.power;
    }
    return total;
  }

  /** Advances the day by `dt` milliseconds and returns what happened. */
  tick(dt: number): DayEvent[] {
    if (this.ended) return [];
    const step = Math.min(Math.max(dt, 0), this.timeLeft);
    const events: DayEvent[] = [];
    this.elapsed += step;
    this.meter = Math.min(
      METER_MAX,
      this.meter + (this.wastePower() * this.config.meterRate * step) / 1000,
    );
    if (this.meter >= METER_MAX) return this.end('meter', events);
    for (const person of this.people) {
      person.nextMove -= step;
      if (person.nextMove > 0) continue;
      const from = person.room;
      const others = this.rooms.filter((r) => r.id !== from);
      const to = (others[Math.floor(this.rng() * others.length)] as Room).id;
      person.room = to;
      person.nextMove = this.stayTime();
      events.push({ kind: 'move', person, from, to, switchedOn: this.switchOnIn(to) });
    }
    if (this.elapsed >= DAY_MS) return this.end('time', events);
    return events;
  }

  /** The player pressed an appliance's switch. */
  press(id: string): PressOutcome {
    const appliance = this.appliance(id);
    if (this.ended || !appliance || !this.on.has(id)) return { kind: 'ignored' };
    if (this.occupied(appliance.room)) {
      this.mistakes++;
      this.streak = 0;
      this.mistakeIds.push(id);
      if (this.mistakes >= MAX_MISTAKES) this.ended = 'mistakes';
      return { kind: 'mistake', appliance, mistakes: this.mistakes, gameOver: this.finished };
    }
    this.on.delete(id);
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.switchedOff++;
    this.offCounts.set(id, (this.offCounts.get(id) ?? 0) + 1);
    const points = appliance.power * POINTS_PER_POWER + streakBonus(this.streak);
    this.score += points;
    return { kind: 'off', appliance, points, streak: this.streak };
  }

  private end(reason: EndReason, events: DayEvent[]): DayEvent[] {
    this.ended = reason;
    events.push({ kind: 'end', reason });
    return events;
  }

  private stayTime(): number {
    const [min, max] = this.config.stay;
    return min + this.rng() * (max - min);
  }

  /** Someone walked in: they switch on one or two things that are off. */
  private switchOnIn(room: RoomId, count = this.rng() < 0.5 ? 1 : 2): Appliance[] {
    const off = this.appliances.filter((a) => a.room === room && !this.on.has(a.id));
    const picked = sample(off, count, this.rng);
    for (const a of picked) this.on.add(a.id);
    return picked;
  }
}

/**
 * Tips for the results: appliances the player got wrong first, then the ones they
 * switched off most. One entry per tip, at most `max`.
 */
export function learnedFrom(day: HouseDay, max = 4): Appliance[] {
  const ranked = [...day.offCounts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const out: Appliance[] = [];
  for (const id of [...day.mistakeIds, ...ranked]) {
    const a = day.appliance(id);
    if (a && !out.some((o) => o.tip === a.tip)) out.push(a);
    if (out.length >= max) break;
  }
  return out;
}

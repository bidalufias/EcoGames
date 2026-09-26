import {
  APPLIANCES,
  FAMILY,
  PLAYER,
  ROOMS,
  type Appliance,
  type FamilyMember,
  type RoomId,
} from '../../content/energy';
import { shuffle, type Rng } from '../../core/random';

export type Level = 'easy' | 'normal' | 'hard';

export interface LevelConfig {
  /** How many family members walk around the house. */
  people: number;
  /** The family's walking speed, in tiles per second. */
  walkSpeed: number;
  /** How long someone uses a thing before moving on, in milliseconds (a random value in this range). */
  use: [number, number];
  /** Chance that the next thing someone uses is in a different room. */
  roam: number;
  /** Meter filled per second for each unit of power left on in an empty room. */
  meterRate: number;
}

export const LEVELS: Record<Level, LevelConfig> = {
  easy: { people: 2, walkSpeed: 1.8, use: [4500, 7500], roam: 0.6, meterRate: 0.26 },
  normal: { people: 3, walkSpeed: 2.2, use: [3500, 6500], roam: 0.65, meterRate: 0.33 },
  hard: { people: 4, walkSpeed: 2.6, use: [2800, 5000], roam: 0.7, meterRate: 0.4 },
};

/** The player walks faster than the family, so there is time to tidy up after them. */
export const PLAYER_SPEED = 4.5;
export const DAY_MS = 90_000;
export const METER_MAX = 100;
const POINTS_PER_POWER = 10;
/** Points lost for switching off something someone is using. */
export const OOPS_PENALTY = 10;

/** Bonus for switch-offs in a row: +5 from 3 in a row, +10 from 6, +15 from 9. */
export function streakBonus(streak: number): number {
  return Math.min(Math.floor(streak / 3), 3) * 5;
}

/** Points for surviving the day: up to 100, more the emptier the bill meter. */
export function meterBonus(meter: number): number {
  return Math.round((1 - Math.min(meter, METER_MAX) / METER_MAX) * 100);
}

/** Stars come mainly from how low the bill meter ended; you have to switch something off. */
export function switchStars(survived: boolean, meter: number, switchedOff: number): number {
  if (!survived || switchedOff === 0) return switchedOff > 0 || survived ? 1 : 0;
  if (meter <= METER_MAX * 0.3) return 3;
  if (meter <= METER_MAX * 0.6) return 2;
  return 1;
}

// ---------- The floor plan ----------

export interface Tile {
  x: number;
  y: number;
}

export type Dir = 'up' | 'down' | 'left' | 'right';

const STEP: Record<Dir, Tile> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * The house seen from above, one character per floor tile. Letters are rooms
 * (b bedroom, l living room, k kitchen, w bathroom), d is a doorway and # is wall.
 * The doorways join the rooms in a ring.
 */
const HOUSE_MAP = [
  '###################',
  '#bbbbbbbb#llllllll#',
  '#bbbbbbbb#llllllll#',
  '#bbbbbbbbdllllllll#',
  '#bbbbbbbb#llllllll#',
  '#bbbbbbbb#llllllll#',
  '####d#########d####',
  '#kkkkkkkk#wwwwwwww#',
  '#kkkkkkkk#wwwwwwww#',
  '#kkkkkkkkdwwwwwwww#',
  '#kkkkkkkk#wwwwwwww#',
  '#kkkkkkkk#wwwwwwww#',
  '###################',
];

const ROOM_CODES: Record<string, RoomId> = {
  b: 'bedroom',
  l: 'living',
  k: 'kitchen',
  w: 'bathroom',
};

/** Where each appliance stands. Appliances block walking; people use them from next to them. */
const APPLIANCE_TILES: Record<string, Tile> = {
  'bedroom-light': { x: 8, y: 1 },
  aircon: { x: 4, y: 1 },
  computer: { x: 7, y: 5 },
  'living-light': { x: 17, y: 1 },
  tv: { x: 13, y: 1 },
  console: { x: 11, y: 1 },
  'kitchen-light': { x: 1, y: 7 },
  kettle: { x: 3, y: 11 },
  'rice-cooker': { x: 6, y: 11 },
  'bathroom-light': { x: 10, y: 11 },
  'water-heater': { x: 17, y: 8 },
};

/** One big piece of furniture per room (the room's picture), which also blocks walking. */
const FURNITURE_TILES: Record<RoomId, Tile> = {
  bedroom: { x: 1, y: 2 },
  living: { x: 17, y: 4 },
  kitchen: { x: 1, y: 11 },
  bathroom: { x: 17, y: 11 },
};

type Cell = RoomId | 'door' | 'wall';

/** The walkable grid of the house, with path finding. */
export class FloorPlan {
  readonly width: number;
  readonly height: number;
  readonly applianceTiles: Readonly<Record<string, Tile>>;
  readonly furnitureTiles: Readonly<Record<RoomId, Tile>>;
  readonly doors: Tile[] = [];
  private cells: Cell[] = [];
  private blocked = new Set<number>();

  constructor(
    map: readonly string[],
    applianceTiles: Record<string, Tile>,
    furnitureTiles: Record<RoomId, Tile>,
  ) {
    this.height = map.length;
    this.width = map[0]?.length ?? 0;
    this.applianceTiles = applianceTiles;
    this.furnitureTiles = furnitureTiles;
    map.forEach((row, y) => {
      for (let x = 0; x < this.width; x++) {
        const ch = row[x] ?? '#';
        const cell: Cell = ch === 'd' ? 'door' : (ROOM_CODES[ch] ?? 'wall');
        this.cells.push(cell);
        if (cell === 'door') this.doors.push({ x, y });
      }
    });
    for (const t of [...Object.values(applianceTiles), ...Object.values(furnitureTiles)]) {
      this.blocked.add(this.index(t));
    }
  }

  inBounds(t: Tile): boolean {
    return t.x >= 0 && t.y >= 0 && t.x < this.width && t.y < this.height;
  }

  private index(t: Tile): number {
    return t.y * this.width + t.x;
  }

  private cell(t: Tile): Cell {
    return this.inBounds(t) ? (this.cells[this.index(t)] ?? 'wall') : 'wall';
  }

  /** The room a tile is in; null for walls and doorways. */
  roomAt(t: Tile): RoomId | null {
    const c = this.cell(t);
    return c === 'wall' || c === 'door' ? null : c;
  }

  isWall(t: Tile): boolean {
    return this.cell(t) === 'wall';
  }

  isDoor(t: Tile): boolean {
    return this.cell(t) === 'door';
  }

  isWalkable(t: Tile): boolean {
    return this.cell(t) !== 'wall' && !this.blocked.has(this.index(t));
  }

  /** Walkable tiles of a room. */
  roomTiles(room: RoomId): Tile[] {
    const out: Tile[] = [];
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        const t = { x, y };
        if (this.roomAt(t) === room && this.isWalkable(t)) out.push(t);
      }
    return out;
  }

  /** The smallest box of tiles covering a room. */
  roomBounds(room: RoomId): { x0: number; y0: number; x1: number; y1: number } {
    const tiles: Tile[] = [];
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) if (this.roomAt({ x, y }) === room) tiles.push({ x, y });
    return {
      x0: Math.min(...tiles.map((t) => t.x)),
      y0: Math.min(...tiles.map((t) => t.y)),
      x1: Math.max(...tiles.map((t) => t.x)),
      y1: Math.max(...tiles.map((t) => t.y)),
    };
  }

  /** The walkable tile, in the same room, where people stand to use an appliance. */
  spotFor(applianceId: string, room: RoomId): Tile {
    const at = this.applianceTiles[applianceId];
    if (!at) throw new Error(`No tile for ${applianceId}`);
    for (const d of [STEP.down, STEP.up, STEP.right, STEP.left]) {
      const t = { x: at.x + d.x, y: at.y + d.y };
      if (this.isWalkable(t) && this.roomAt(t) === room) return t;
    }
    throw new Error(`Nowhere to stand next to ${applianceId}`);
  }

  /** Shortest walk between two tiles (4-way, through doorways), excluding the start. */
  path(from: Tile, to: Tile): Tile[] | null {
    if (!this.isWalkable(to)) return null;
    const start = this.index(from);
    const goal = this.index(to);
    if (start === goal) return [];
    const prev = new Map<number, number>([[start, -1]]);
    const queue = [from];
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head]!;
      for (const d of Object.values(STEP)) {
        const next = { x: cur.x + d.x, y: cur.y + d.y };
        const i = this.index(next);
        if (!this.inBounds(next) || prev.has(i) || !this.isWalkable(next)) continue;
        prev.set(i, this.index(cur));
        if (i === goal) {
          const out: Tile[] = [];
          for (let at = i; at !== start; at = prev.get(at)!) {
            out.push({ x: at % this.width, y: Math.floor(at / this.width) });
          }
          return out.reverse();
        }
        queue.push(next);
      }
    }
    return null;
  }

  /** The walkable tile closest to `t` (itself if walkable). */
  nearestWalkable(t: Tile): Tile {
    let best: Tile = this.doors[0] ?? { x: 1, y: 1 };
    let bestDist = Infinity;
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        if (!this.isWalkable({ x, y })) continue;
        const dist = (x - t.x) ** 2 + (y - t.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = { x, y };
        }
      }
    return best;
  }
}

export const FLOOR_PLAN = new FloorPlan(HOUSE_MAP, APPLIANCE_TILES, FURNITURE_TILES);

// ---------- People ----------

/** Anyone who walks around the house, tile by tile. Positions are in tile units. */
export class Walker {
  readonly member: FamilyMember;
  x: number;
  y: number;
  speed: number;
  path: Tile[] = [];
  /** Which way they last walked sideways, so the view can turn them around. */
  facing: -1 | 1 = 1;

  constructor(member: FamilyMember, start: Tile, speed: number) {
    this.member = member;
    this.x = start.x;
    this.y = start.y;
    this.speed = speed;
  }

  get name(): string {
    return this.member.name;
  }

  /** The tile they are standing on (or mostly on, mid-step). */
  get tile(): Tile {
    return { x: Math.round(this.x), y: Math.round(this.y) };
  }

  get moving(): boolean {
    return this.path.length > 0;
  }

  /** Walks a new route. Starts from the middle of the current tile so they never cut corners. */
  setPath(path: Tile[]): void {
    const here = this.tile;
    const between = here.x !== this.x || here.y !== this.y;
    this.path = between ? [here, ...path] : path;
  }

  /** Moves along the path. Returns true when this step reaches the end of it. */
  advance(dt: number): boolean {
    let budget = (this.speed * dt) / 1000;
    while (budget > 0 && this.path.length > 0) {
      const next = this.path[0]!;
      const dx = next.x - this.x;
      const dy = next.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      if (dist <= budget) {
        this.x = next.x;
        this.y = next.y;
        this.path.shift();
        budget -= dist;
        if (this.path.length === 0) return true;
      } else {
        this.x += (dx / dist) * budget;
        this.y += (dy / dist) * budget;
        budget = 0;
      }
    }
    return false;
  }
}

/** A family member: walks to something, switches it on, uses it for a while, then moves on. */
export class Person extends Walker {
  /** The appliance they are walking to or using. */
  target: string | null = null;
  /** Milliseconds left using the target, once they have arrived. */
  useLeft = 0;
}

// ---------- The day ----------

export type EndReason = 'time' | 'meter';

export type PressOutcome =
  | { kind: 'off'; appliance: Appliance; points: number; streak: number }
  /** Someone is in the room using it: they switch it straight back on. */
  | { kind: 'oops'; appliance: Appliance; by: Person; penalty: number }
  /** Someone walked in while the player was on the way over: no harm done. */
  | { kind: 'busy'; appliance: Appliance; by: Person }
  | { kind: 'ignored' };

export type DayEvent =
  | { kind: 'on'; person: Person; appliance: Appliance }
  /** Everyone left a room with things still on. */
  | { kind: 'left-on'; room: RoomId; appliances: Appliance[] }
  | { kind: 'press'; outcome: PressOutcome }
  | { kind: 'end'; reason: EndReason };

/** One day in the house: the family wandering about, the player tidying up, and the bill. */
export class HouseDay {
  readonly config: LevelConfig;
  readonly plan: FloorPlan;
  readonly appliances: readonly Appliance[];
  readonly people: Person[];
  readonly player: Walker;
  /** Ids of the appliances that are on. */
  readonly on = new Set<string>();
  /** How many times the player switched off each appliance. */
  readonly offCounts = new Map<string, number>();
  /** Appliances the player tried to switch off while someone was using them. */
  readonly oopsIds: string[] = [];
  elapsed = 0;
  meter = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  oops = 0;
  switchedOff = 0;
  ended: EndReason | null = null;
  /** The appliance the player is walking over to switch off. */
  heading: string | null = null;
  private rng: Rng;
  private dayMs: number;

  constructor(
    level: Level,
    rng: Rng,
    opts: { plan?: FloorPlan; appliances?: readonly Appliance[]; dayMs?: number } = {},
  ) {
    this.config = LEVELS[level];
    this.rng = rng;
    this.plan = opts.plan ?? FLOOR_PLAN;
    this.appliances = opts.appliances ?? APPLIANCES;
    this.dayMs = opts.dayMs ?? DAY_MS;
    this.player = new Walker(PLAYER, this.plan.doors[0] ?? { x: 1, y: 1 }, PLAYER_SPEED);

    // Everyone starts in a different room and heads for something there.
    const rooms = shuffle(ROOMS, rng);
    this.people = FAMILY.slice(0, this.config.people).map((member, i) => {
      const room = rooms[i % rooms.length]!.id;
      const person = new Person(
        member,
        this.pick(this.plan.roomTiles(room)),
        this.config.walkSpeed,
      );
      this.sendTo(person, this.pick(this.appliancesIn(room)).id);
      if (!person.moving) this.arrive(person, []);
      return person;
    });
    // Something was left on this morning, so there is a job to do straight away.
    const empty = ROOMS.filter((r) => !this.occupied(r.id));
    if (empty.length > 0) this.on.add(this.pick(this.appliancesIn(this.pick(empty).id)).id);
  }

  get finished(): boolean {
    return this.ended !== null;
  }

  get survived(): boolean {
    return this.ended === 'time';
  }

  get timeLeft(): number {
    return Math.max(0, this.dayMs - this.elapsed);
  }

  /** Final score: switch-offs and streak bonuses, plus the meter bonus for surviving. */
  get finalScore(): number {
    return this.score + (this.survived ? meterBonus(this.meter) : 0);
  }

  appliance(id: string): Appliance | undefined {
    return this.appliances.find((a) => a.id === id);
  }

  appliancesIn(room: RoomId): Appliance[] {
    return this.appliances.filter((a) => a.room === room);
  }

  roomOf(w: Walker): RoomId | null {
    return this.plan.roomAt(w.tile);
  }

  peopleIn(room: RoomId): Person[] {
    return this.people.filter((p) => this.roomOf(p) === room);
  }

  occupied(room: RoomId): boolean {
    return this.people.some((p) => this.roomOf(p) === room);
  }

  isOn(id: string): boolean {
    return this.on.has(id);
  }

  /** On, with nobody in the room to use it. */
  isWasted(a: Appliance): boolean {
    return this.on.has(a.id) && !this.occupied(a.room);
  }

  /** Total power of the appliances left on in empty rooms. */
  wastePower(): number {
    return this.appliances.reduce((sum, a) => sum + (this.isWasted(a) ? a.power : 0), 0);
  }

  /** The player is next to an appliance, on the same side of the wall. */
  inReach(id: string): boolean {
    const a = this.appliance(id);
    const at = this.plan.applianceTiles[id];
    if (!a || !at) return false;
    const t = this.player.tile;
    return Math.abs(t.x - at.x) <= 1 && Math.abs(t.y - at.y) <= 1 && this.plan.roomAt(t) === a.room;
  }

  /** Advances the day by `dt` milliseconds and returns what happened. */
  tick(dt: number): DayEvent[] {
    if (this.ended) return [];
    const step = Math.min(Math.max(dt, 0), this.timeLeft);
    const events: DayEvent[] = [];
    const before = new Set(ROOMS.filter((r) => this.occupied(r.id)).map((r) => r.id));
    this.elapsed += step;

    for (const p of this.people) {
      if (p.moving) {
        if (p.advance(step)) this.arrive(p, events);
      } else if (p.target) {
        p.useLeft -= step;
        if (p.useLeft <= 0) this.moveOn(p, events);
      } else {
        this.moveOn(p, events);
      }
    }
    for (const room of before) {
      if (this.occupied(room)) continue;
      const leftOn = this.appliancesIn(room).filter((a) => this.on.has(a.id));
      if (leftOn.length > 0) events.push({ kind: 'left-on', room, appliances: leftOn });
    }

    if (this.player.moving && this.player.advance(step) && this.heading) {
      const id = this.heading;
      this.heading = null;
      events.push({ kind: 'press', outcome: this.switchOff(id, true) });
    }

    this.meter = Math.min(
      METER_MAX,
      this.meter + (this.wastePower() * this.config.meterRate * step) / 1000,
    );
    if (this.meter >= METER_MAX) return this.end('meter', events);
    if (this.elapsed >= this.dayMs) return this.end('time', events);
    return events;
  }

  // ---------- Player controls ----------

  /** Walk to a tile (or the nearest walkable one). */
  walkTo(t: Tile): void {
    if (this.ended) return;
    this.heading = null;
    const dest = this.plan.nearestWalkable(t);
    this.player.setPath(this.plan.path(this.player.tile, dest) ?? []);
  }

  /** Take one step (keyboard). Returns false while still mid-step or when a wall is in the way. */
  step(dir: Dir): boolean {
    if (this.ended || this.player.moving) return false;
    const t = this.player.tile;
    const next = { x: t.x + STEP[dir].x, y: t.y + STEP[dir].y };
    if (dir === 'left') this.player.facing = -1;
    if (dir === 'right') this.player.facing = 1;
    if (!this.plan.isWalkable(next)) return false;
    this.heading = null;
    this.player.setPath([next]);
    return true;
  }

  /**
   * Go and switch something off: right away when it's in reach, otherwise walk
   * over and switch it off on arrival (the result comes back from `tick`).
   */
  goSwitch(id: string): PressOutcome | null {
    const a = this.appliance(id);
    if (this.ended || !a) return { kind: 'ignored' };
    if (this.inReach(id) && !this.player.moving) return this.switchOff(id);
    const spot = this.plan.spotFor(id, a.room);
    this.heading = id;
    this.player.setPath(this.plan.path(this.player.tile, spot) ?? []);
    if (!this.player.moving) {
      this.heading = null;
      return this.switchOff(id);
    }
    return null;
  }

  /** Switch off whatever is on within reach (keyboard). Prefers things left on in empty rooms. */
  interact(): PressOutcome {
    if (this.ended || this.player.moving) return { kind: 'ignored' };
    const near = this.appliances.filter((a) => this.inReach(a.id) && this.on.has(a.id));
    const best = near.find((a) => this.isWasted(a)) ?? near[0];
    return best ? this.switchOff(best.id) : { kind: 'ignored' };
  }

  /** The appliance `interact` would switch off, for the view to highlight. */
  reachable(): Appliance | undefined {
    if (this.player.moving) return undefined;
    const near = this.appliances.filter((a) => this.inReach(a.id) && this.on.has(a.id));
    return near.find((a) => this.isWasted(a)) ?? near[0];
  }

  private switchOff(id: string, arriving = false): PressOutcome {
    const appliance = this.appliance(id);
    if (this.ended || !appliance || !this.on.has(id) || !this.inReach(id)) {
      return { kind: 'ignored' };
    }
    const by = this.peopleIn(appliance.room)[0];
    if (by && arriving) return { kind: 'busy', appliance, by };
    if (by) {
      const penalty = Math.min(OOPS_PENALTY, this.score);
      this.score -= penalty;
      this.oops++;
      this.streak = 0;
      this.oopsIds.push(id);
      return { kind: 'oops', appliance, by, penalty };
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

  // ---------- The family ----------

  private pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.rng() * items.length)] as T;
  }

  private sendTo(p: Person, id: string): void {
    const a = this.appliance(id)!;
    p.target = id;
    p.useLeft = 0;
    p.setPath(this.plan.path(p.tile, this.plan.spotFor(id, a.room)) ?? []);
  }

  /** Arrived at their target: switch it on and use it for a while. */
  private arrive(p: Person, events: DayEvent[]): void {
    const a = p.target ? this.appliance(p.target) : undefined;
    if (!a) return;
    const [min, max] = this.config.use;
    p.useLeft = min + this.rng() * (max - min);
    if (!this.on.has(a.id)) {
      this.on.add(a.id);
      events.push({ kind: 'on', person: p, appliance: a });
    }
  }

  /** Finished with something: pick the next thing to use, often in another room. */
  private moveOn(p: Person, events: DayEvent[]): void {
    const here = this.roomOf(p);
    const busy = new Set(this.people.filter((o) => o !== p).map((o) => o.target));
    const free = (a: Appliance) => a.id !== p.target && !busy.has(a.id);
    const sameRoom = this.appliances.filter((a) => a.room === here && free(a));
    const elsewhere = this.appliances.filter((a) => a.room !== here && free(a));
    const pool = sameRoom.length === 0 || this.rng() < this.config.roam ? elsewhere : sameRoom;
    const next = pool.length > 0 ? this.pick(pool) : undefined;
    if (!next) return;
    this.sendTo(p, next.id);
    // Already standing at it (a second thing within reach): use it straight away.
    if (!p.moving) this.arrive(p, events);
  }

  private end(reason: EndReason, events: DayEvent[]): DayEvent[] {
    this.ended = reason;
    events.push({ kind: 'end', reason });
    return events;
  }
}

/**
 * Tips for the results: appliances the player got wrong first, then the ones they
 * switched off most. One entry per tip, at most `max`.
 */
export function learnedFrom(day: HouseDay, max = 4): Appliance[] {
  const ranked = [...day.offCounts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const out: Appliance[] = [];
  for (const id of [...day.oopsIds, ...ranked]) {
    const a = day.appliance(id);
    if (a && !out.some((o) => o.tip === a.tip)) out.push(a);
    if (out.length >= max) break;
  }
  return out;
}

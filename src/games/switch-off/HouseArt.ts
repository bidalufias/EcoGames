import type * as Phaser from 'phaser';
import { ROOMS } from '../../content/energy';
import type { Dir, Furniture, Tile } from './house';
import type { Area, FloorPlan } from './logic';

// Draws the Switch Off! house as an architect's floor plan: wood and tile floors,
// solid walls with windows, doors with their swing, and furniture seen from above.
// Everything is drawn in plan units (one tile = 1, tile centres on whole numbers)
// through a PlanView, so the same code draws the plan turned on its side for phones.

export interface PlanView {
  /** A point on the plan in game pixels. */
  point(x: number, y: number): { x: number; y: number };
  /** Tile size in game pixels. */
  t: number;
  /** True when the plan is drawn on its side (plan x runs down the screen). */
  portrait: boolean;
}

interface Floor {
  base: number;
  line: number;
  /** Second tile colour, for a checked floor. */
  alt?: number;
  kind: 'wood' | 'tile' | 'small-tile';
}

export interface HousePalette {
  floors: Record<Area, Floor>;
  wall: number;
  glass: number;
  glassLine: number;
  door: number;
  swing: number;
  step: number;
  shadow: number;
  shadowAlpha: number;
  wood: number;
  woodDark: number;
  woodLight: number;
  fabric: number;
  fabricLight: number;
  sheet: number;
  blanket: number;
  blanketLight: number;
  rugs: Record<Area, number>;
  rugBorder: number;
  mat: number;
  bathmat: number;
  white: number;
  whiteLine: number;
  water: number;
  counter: number;
  counterEdge: number;
  steel: number;
  hob: number;
  burner: number;
  leaf: number;
  leafDark: number;
  pot: number;
  lampShade: number;
  books: readonly number[];
}

export const LIGHT_HOUSE: HousePalette = {
  floors: {
    bedroom: { base: 0xf1e3c8, line: 0xdcc6a0, kind: 'wood' },
    living: { base: 0xf3dfbd, line: 0xddc298, kind: 'wood' },
    hall: { base: 0xebdcc2, line: 0xd6c2a0, kind: 'wood' },
    kitchen: { base: 0xf5f2ea, alt: 0xe7e2d6, line: 0xd8d1c2, kind: 'tile' },
    bathroom: { base: 0xe4f2f4, line: 0xc4dde2, kind: 'small-tile' },
  },
  wall: 0x3a4350,
  glass: 0xd5ecf8,
  glassLine: 0x6f9fbd,
  door: 0x9a7552,
  swing: 0x8b8f96,
  step: 0xcfc6b8,
  shadow: 0x2a1d10,
  shadowAlpha: 0.12,
  wood: 0xc0915f,
  woodDark: 0x8f6540,
  woodLight: 0xd9b181,
  fabric: 0x4f86c6,
  fabricLight: 0x76a6dc,
  sheet: 0xffffff,
  blanket: 0x4aa3a0,
  blanketLight: 0x7cc3bf,
  rugs: {
    bedroom: 0xe8b7a2,
    living: 0xd9a066,
    hall: 0xc8876a,
    kitchen: 0xd9a066,
    bathroom: 0x9fd3c7,
  },
  rugBorder: 0xffffff,
  mat: 0xcfae7a,
  bathmat: 0x9fd3c7,
  white: 0xfcfcfc,
  whiteLine: 0xaab2bc,
  water: 0xbfe4f3,
  counter: 0xdcd6ca,
  counterEdge: 0xb5ad9d,
  steel: 0xc3c9d0,
  hob: 0x2e3136,
  burner: 0x767b84,
  leaf: 0x4e9d53,
  leafDark: 0x377a3c,
  pot: 0xc8714c,
  lampShade: 0xf6e7b8,
  books: [0xd9534f, 0x4a90d9, 0xf0ad4e, 0x5cb85c, 0x8e6fc9],
};

export const DARK_HOUSE: HousePalette = {
  floors: {
    bedroom: { base: 0x3a3129, line: 0x2e2620, kind: 'wood' },
    living: { base: 0x3d3227, line: 0x30271e, kind: 'wood' },
    hall: { base: 0x362e27, line: 0x2b241e, kind: 'wood' },
    kitchen: { base: 0x2f3235, alt: 0x292c2f, line: 0x3b3f44, kind: 'tile' },
    bathroom: { base: 0x243337, line: 0x2f4247, kind: 'small-tile' },
  },
  wall: 0x8793a0,
  glass: 0x3b6a86,
  glassLine: 0x8cb8d4,
  door: 0x8a6a4c,
  swing: 0x7c838c,
  step: 0x4a4540,
  shadow: 0x000000,
  shadowAlpha: 0.3,
  wood: 0x7a5a3d,
  woodDark: 0x5a412b,
  woodLight: 0x94714f,
  fabric: 0x3b5f88,
  fabricLight: 0x4d76a4,
  sheet: 0xc9cdd3,
  blanket: 0x2f6d6b,
  blanketLight: 0x3f8784,
  rugs: {
    bedroom: 0x6e4a40,
    living: 0x6b4c2e,
    hall: 0x5e3e32,
    kitchen: 0x6b4c2e,
    bathroom: 0x3c6860,
  },
  rugBorder: 0x9aa1a8,
  mat: 0x6f5a3c,
  bathmat: 0x3c6860,
  white: 0xc6cbd1,
  whiteLine: 0x7d858f,
  water: 0x5e8ea3,
  counter: 0x57544e,
  counterEdge: 0x45423d,
  steel: 0x8b929a,
  hob: 0x141618,
  burner: 0x50555c,
  leaf: 0x3f8246,
  leafDark: 0x2e6334,
  pot: 0x92563a,
  lampShade: 0xb9ad86,
  books: [0xa94442, 0x3a70a8, 0xb9853b, 0x478f47, 0x6f58a0],
};

/** Plan-unit box, by its edges. */
export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const OUTER_WALL = 0.3;
const INNER_WALL = 0.2;

/** Draws plan-unit shapes onto a Graphics object. */
class Pen {
  constructor(
    private g: Phaser.GameObjects.Graphics,
    private v: PlanView,
  ) {}

  private box(r: Box) {
    const a = this.v.point(r.x0, r.y0);
    const b = this.v.point(r.x1, r.y1);
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(b.x - a.x),
      h: Math.abs(b.y - a.y),
    };
  }

  rect(r: Box, color: number, alpha = 1, radius = 0): void {
    const b = this.box(r);
    this.g.fillStyle(color, alpha);
    const rad = Math.min(radius * this.v.t, b.w / 2, b.h / 2);
    if (rad >= 1) this.g.fillRoundedRect(b.x, b.y, b.w, b.h, rad);
    else this.g.fillRect(b.x, b.y, b.w, b.h);
  }

  outline(r: Box, color: number, width: number, alpha = 1, radius = 0): void {
    const b = this.box(r);
    this.g.lineStyle(Math.max(1, width * this.v.t), color, alpha);
    const rad = Math.min(radius * this.v.t, b.w / 2, b.h / 2);
    if (rad >= 1) this.g.strokeRoundedRect(b.x, b.y, b.w, b.h, rad);
    else this.g.strokeRect(b.x, b.y, b.w, b.h);
  }

  circle(x: number, y: number, r: number, color: number, alpha = 1): void {
    const p = this.v.point(x, y);
    this.g.fillStyle(color, alpha);
    this.g.fillCircle(p.x, p.y, r * this.v.t);
  }

  ring(x: number, y: number, r: number, width: number, color: number, alpha = 1): void {
    const p = this.v.point(x, y);
    this.g.lineStyle(Math.max(1, width * this.v.t), color, alpha);
    this.g.strokeCircle(p.x, p.y, r * this.v.t);
  }

  ellipse(x: number, y: number, rx: number, ry: number, color: number, alpha = 1): void {
    const p = this.v.point(x, y);
    const [w, h] = this.v.portrait ? [ry, rx] : [rx, ry];
    this.g.fillStyle(color, alpha);
    this.g.fillEllipse(p.x, p.y, w * 2 * this.v.t, h * 2 * this.v.t);
  }

  line(x0: number, y0: number, x1: number, y1: number, width: number, color: number, alpha = 1) {
    const a = this.v.point(x0, y0);
    const b = this.v.point(x1, y1);
    this.g.lineStyle(Math.max(1, width * this.v.t), color, alpha);
    this.g.lineBetween(a.x, a.y, b.x, b.y);
  }

  path(points: readonly [number, number][], width: number, color: number, alpha = 1): void {
    const pts = points.map(([x, y]) => this.v.point(x, y));
    this.g.lineStyle(Math.max(1, width * this.v.t), color, alpha);
    this.g.beginPath();
    pts.forEach((p, i) => (i === 0 ? this.g.moveTo(p.x, p.y) : this.g.lineTo(p.x, p.y)));
    this.g.strokePath();
  }
}

const inset = (r: Box, d: number): Box => ({
  x0: r.x0 + d,
  y0: r.y0 + d,
  x1: r.x1 - d,
  y1: r.y1 - d,
});

/**
 * A piece's own coordinates: u runs across its width (0 to 1) and v from its back
 * (against the wall) to its front (the side people use), whichever way it faces.
 */
function local(r: Box, facing: Dir = 'down') {
  const acrossX = facing === 'up' || facing === 'down';
  const w = acrossX ? r.x1 - r.x0 : r.y1 - r.y0;
  const d = acrossX ? r.y1 - r.y0 : r.x1 - r.x0;
  const pt = (u: number, v: number): [number, number] => {
    const across = (acrossX ? r.x0 : r.y0) + u * w;
    const deep =
      facing === 'down'
        ? r.y0 + v * d
        : facing === 'up'
          ? r.y1 - v * d
          : facing === 'right'
            ? r.x0 + v * d
            : r.x1 - v * d;
    return acrossX ? [across, deep] : [deep, across];
  };
  return {
    /** Width and depth in tiles. */
    w,
    d,
    pt,
    box(u0: number, v0: number, u1: number, v1: number): Box {
      const [ax, ay] = pt(u0, v0);
      const [bx, by] = pt(u1, v1);
      return {
        x0: Math.min(ax, bx),
        y0: Math.min(ay, by),
        x1: Math.max(ax, bx),
        y1: Math.max(ay, by),
      };
    },
  };
}

/** Furniture that stands free in the room, rather than pushed up against a wall. */
const FREE_STANDING = new Set<Furniture['kind']>([
  'rug',
  'runner',
  'bathmat',
  'doormat',
  'chair',
  'plant',
  'coffee-table',
  'floor-lamp',
  'sink',
  'hob',
  'table',
  'sofa',
  'armchair',
]);

export class HouseArt {
  private pen: Pen;

  /**
   * `base` gets the floors and furniture, `top` the walls, windows and doors, so the
   * scene can dim a room between the two.
   */
  constructor(
    private base: Phaser.GameObjects.Graphics,
    private top: Phaser.GameObjects.Graphics,
    private plan: FloorPlan,
    private p: HousePalette,
    private view: PlanView,
  ) {
    this.pen = new Pen(base, view);
  }

  draw(): void {
    this.base.clear();
    this.top.clear();
    this.pen = new Pen(this.base, this.view);
    this.floors();
    for (const f of this.plan.furniture) this.piece(f);
    this.pen = new Pen(this.top, this.view);
    this.walls();
    this.windows();
    this.doors();
    this.frontDoor();
  }

  /**
   * A room's floor, out to the middle of its walls. Where it opens onto another room
   * (the hallway into the living room) it stops at the middle of its last tile, in
   * line with the walls either side.
   */
  areaBox(area: Area): Box {
    const plan = this.plan;
    const b = plan.roomBounds(area);
    const shut = (tiles: Tile[]) => tiles.some((t) => plan.isWall(t) || plan.isDoor(t));
    const xs = (y: number) => range(b.x0, b.x1).map((x) => ({ x, y }));
    const ys = (x: number) => range(b.y0, b.y1).map((y) => ({ x, y }));
    return {
      x0: shut(ys(b.x0 - 1)) ? b.x0 - 1 : b.x0,
      x1: shut(ys(b.x1 + 1)) ? b.x1 + 1 : b.x1,
      y0: shut(xs(b.y0 - 1)) ? b.y0 - 1 : b.y0,
      y1: shut(xs(b.y1 + 1)) ? b.y1 + 1 : b.y1,
    };
  }

  // ---------- Floors ----------

  private floors(): void {
    const areas: Area[] = [...ROOMS.map((r) => r.id), 'hall'];
    for (const area of areas) {
      const r = this.areaBox(area);
      const f = this.p.floors[area];
      this.pen.rect(r, f.base);
      if (f.kind === 'wood') this.planks(r, f.line);
      else this.tiles(r, f, f.kind === 'tile' ? 0.5 : 1 / 3);
    }
  }

  /** Floorboards: long boards with staggered joints. */
  private planks(r: Box, color: number): void {
    const board = 1 / 3;
    const length = 1.7;
    let row = 0;
    for (let y = r.y0; y < r.y1 - 0.01; y += board, row++) {
      if (y > r.y0) this.pen.line(r.x0, y, r.x1, y, 0.02, color);
      const y1 = Math.min(y + board, r.y1);
      for (let x = r.x0 + ((row * 0.61) % 1) * length; x < r.x1; x += length) {
        this.pen.line(x, y, x, y1, 0.02, color);
      }
    }
  }

  /** Floor tiles lined up with the plan's grid, checked when there is a second colour. */
  private tiles(r: Box, f: Floor, size: number): void {
    const start = (v: number) => Math.floor((v - 0.5) / size) * size + 0.5;
    if (f.alt !== undefined) {
      for (let y = start(r.y0), j = 0; y < r.y1; y += size, j++)
        for (let x = start(r.x0), i = 0; x < r.x1; x += size, i++) {
          if ((Math.round((x - 0.5) / size) + Math.round((y - 0.5) / size)) % 2 === 0) continue;
          this.pen.rect(
            {
              x0: Math.max(x, r.x0),
              y0: Math.max(y, r.y0),
              x1: Math.min(x + size, r.x1),
              y1: Math.min(y + size, r.y1),
            },
            f.alt,
          );
        }
    }
    for (let x = start(r.x0); x < r.x1; x += size) {
      if (x > r.x0) this.pen.line(x, r.y0, x, r.y1, 0.02, f.line);
    }
    for (let y = start(r.y0); y < r.y1; y += size) {
      if (y > r.y0) this.pen.line(r.x0, y, r.x1, y, 0.02, f.line);
    }
  }

  // ---------- Walls, windows and doors ----------

  private onEdge(t: Tile): boolean {
    return t.x === 0 || t.y === 0 || t.x === this.plan.width - 1 || t.y === this.plan.height - 1;
  }

  /** Half the thickness of the wall running between two wall tiles. */
  private half(a: Tile, b: Tile): number {
    return (this.onEdge(a) && this.onEdge(b) ? OUTER_WALL : INNER_WALL) / 2;
  }

  private walls(): void {
    const { plan, pen, p } = this;
    for (let y = 0; y < plan.height; y++)
      for (let x = 0; x < plan.width; x++) {
        const t = { x, y };
        if (!plan.isWall(t)) continue;
        const h0 = this.half(t, t);
        pen.rect({ x0: x - h0, y0: y - h0, x1: x + h0, y1: y + h0 }, p.wall);
        const right = { x: x + 1, y };
        if (plan.inBounds(right) && plan.isWall(right)) {
          const h = this.half(t, right);
          pen.rect({ x0: x, y0: y - h, x1: x + 1, y1: y + h }, p.wall);
        }
        const down = { x, y: y + 1 };
        if (plan.inBounds(down) && plan.isWall(down)) {
          const h = this.half(t, down);
          pen.rect({ x0: x - h, y0: y, x1: x + h, y1: y + 1 }, p.wall);
        }
      }
    // Doorways are one tile wide: the walls either side reach to the door frame.
    for (const d of plan.doors) {
      for (const [dx, dy] of STEPS) {
        const n = { x: d.x + dx, y: d.y + dy };
        if (!plan.isWall(n)) continue;
        const h = INNER_WALL / 2;
        const ex = d.x + dx * 0.5;
        const ey = d.y + dy * 0.5;
        pen.rect(
          dx !== 0
            ? { x0: Math.min(ex, n.x), y0: d.y - h, x1: Math.max(ex, n.x), y1: d.y + h }
            : { x0: d.x - h, y0: Math.min(ey, n.y), x1: d.x + h, y1: Math.max(ey, n.y) },
          p.wall,
        );
      }
    }
  }

  private windows(): void {
    const { pen, p } = this;
    const h = OUTER_WALL / 2;
    for (const w of this.plan.layout.windows) {
      const across = w.w >= w.h;
      const r: Box = across
        ? { x0: w.x - 0.4, y0: w.y - h, x1: w.x + w.w - 0.6, y1: w.y + h }
        : { x0: w.x - h, y0: w.y - 0.4, x1: w.x + h, y1: w.y + w.h - 0.6 };
      pen.rect(r, p.glass);
      pen.outline(r, p.glassLine, 0.03);
      if (across) pen.line(r.x0, w.y, r.x1, w.y, 0.025, p.glassLine);
      else pen.line(w.x, r.y0, w.x, r.y1, 0.025, p.glassLine);
    }
  }

  /** A door hinged on one side of the doorway, with the arc it swings through. */
  private doorLeaf(hinge: [number, number], open: [number, number], shut: [number, number]) {
    const { pen, p } = this;
    const a0 = Math.atan2(open[1], open[0]);
    let a1 = Math.atan2(shut[1], shut[0]);
    if (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
    if (a0 - a1 > Math.PI) a1 += Math.PI * 2;
    const arc: [number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const a = a0 + ((a1 - a0) * i) / 16;
      arc.push([hinge[0] + Math.cos(a) * 0.96, hinge[1] + Math.sin(a) * 0.96]);
    }
    pen.path(arc, 0.025, p.swing, 0.7);
    pen.line(hinge[0], hinge[1], hinge[0] + open[0], hinge[1] + open[1], 0.08, p.door);
  }

  private doors(): void {
    const plan = this.plan;
    for (const d of plan.doors) {
      const across = plan.isWall({ x: d.x - 1, y: d.y });
      // Doors open into a room rather than the hallway.
      const sides: [number, number][] = across
        ? [
            [0, -1],
            [0, 1],
          ]
        : [
            [-1, 0],
            [1, 0],
          ];
      const into =
        sides.find(([dx, dy]) => plan.roomAt({ x: d.x + dx, y: d.y + dy }) !== null) ?? sides[0]!;
      if (across) this.doorLeaf([d.x - 0.5, d.y], [0, into[1]], [1, 0]);
      else this.doorLeaf([d.x, d.y - 0.5], [into[0], 0], [0, 1]);
    }
  }

  private frontDoor(): void {
    const { pen, p, plan } = this;
    const d = plan.layout.frontDoor;
    const h = OUTER_WALL / 2 + 0.02;
    const inside = plan.areaAt({ x: d.x, y: d.y - 1 }) ?? 'living';
    // The doorstep outside, then the opening in the wall.
    pen.rect({ x0: d.x - 0.6, y0: d.y, x1: d.x + 0.6, y1: d.y + 0.42 }, p.step, 1, 0.05);
    pen.rect({ x0: d.x - 0.5, y0: d.y - h, x1: d.x + 0.5, y1: d.y + h }, p.floors[inside].base);
    pen.line(d.x - 0.5, d.y + h, d.x + 0.5, d.y + h, 0.03, p.wall);
    this.doorLeaf([d.x + 0.5, d.y - h], [0, -1], [-1, 0]);
  }

  // ---------- Furniture ----------

  /** A piece's box, pushed back to the face of any wall it stands against. */
  private pieceBox(f: Furniture): Box {
    const w = f.w ?? 1;
    const h = f.h ?? 1;
    const r: Box = { x0: f.x - 0.5, y0: f.y - 0.5, x1: f.x + w - 0.5, y1: f.y + h - 0.5 };
    if (FREE_STANDING.has(f.kind)) return r;
    const plan = this.plan;
    const against = (tiles: Tile[]) =>
      tiles.every((t) => plan.isWall(t))
        ? tiles.some((t) => this.onEdge(t))
          ? OUTER_WALL
          : INNER_WALL
        : 0;
    const xs = range(f.x, f.x + w - 1);
    const ys = range(f.y, f.y + h - 1);
    const push = (wall: number) => (wall ? 0.5 - wall / 2 : 0);
    return {
      x0: r.x0 - push(against(ys.map((y) => ({ x: f.x - 1, y })))),
      x1: r.x1 + push(against(ys.map((y) => ({ x: f.x + w, y })))),
      y0: r.y0 - push(against(xs.map((x) => ({ x, y: f.y - 1 })))),
      y1: r.y1 + push(against(xs.map((x) => ({ x, y: f.y + h })))),
    };
  }

  private shadowOf(r: Box, radius = 0.08): void {
    const { pen, p } = this;
    pen.rect(
      { x0: r.x0 + 0.03, y0: r.y0 + 0.05, x1: r.x1 + 0.03, y1: r.y1 + 0.05 },
      p.shadow,
      p.shadowAlpha,
      radius,
    );
  }

  private piece(f: Furniture): void {
    const { pen, p } = this;
    const r = this.pieceBox(f);
    const L = local(r, f.facing);
    const area = this.plan.areaAt({ x: Math.round(f.x), y: Math.round(f.y) }) ?? 'living';
    const line = 0.025;
    switch (f.kind) {
      case 'rug':
      case 'runner': {
        const b = inset(r, 0.12);
        pen.rect(b, p.rugs[area], 0.9, 0.12);
        pen.outline(inset(b, 0.1), p.rugBorder, 0.03, 0.55, 0.08);
        break;
      }
      case 'doormat':
        pen.rect(
          { x0: r.x0 + 0.14, y0: r.y0 + 0.3, x1: r.x1 - 0.14, y1: r.y1 - 0.06 },
          p.mat,
          1,
          0.06,
        );
        break;
      case 'bathmat':
        pen.rect(inset(r, 0.18), p.bathmat, 0.95, 0.12);
        break;
      case 'bed': {
        this.shadowOf(r);
        pen.rect(inset(r, 0.04), p.woodDark, 1, 0.1);
        pen.rect(L.box(0.06, 0.08 / L.d, 0.94, 0.95), p.sheet, 1, 0.08);
        const pw = 0.4;
        pen.rect(L.box(0.1, 0.15 / L.d, 0.1 + pw, 0.6 / L.d), p.white, 1, 0.1);
        pen.outline(L.box(0.1, 0.15 / L.d, 0.1 + pw, 0.6 / L.d), p.whiteLine, line, 0.8, 0.1);
        pen.rect(L.box(0.9 - pw, 0.15 / L.d, 0.9, 0.6 / L.d), p.white, 1, 0.1);
        pen.outline(L.box(0.9 - pw, 0.15 / L.d, 0.9, 0.6 / L.d), p.whiteLine, line, 0.8, 0.1);
        pen.rect(L.box(0.04, 0.36, 0.96, 0.97), p.blanket, 1, 0.08);
        pen.rect(L.box(0.04, 0.36, 0.96, 0.44), p.blanketLight, 1, 0.04);
        break;
      }
      case 'bedside':
      case 'coffee-table': {
        const b = inset(r, f.kind === 'bedside' ? 0.1 : 0.14);
        this.shadowOf(b);
        pen.rect(b, p.wood, 1, 0.08);
        pen.outline(b, p.woodDark, line, 1, 0.08);
        if (f.kind === 'coffee-table') pen.rect(inset(b, 0.12), p.woodLight, 1, 0.05);
        break;
      }
      case 'desk':
      case 'tv-unit':
      case 'shelf':
      case 'shoe-rack':
      case 'pantry':
      case 'wardrobe': {
        const depth = {
          desk: 0.75,
          'tv-unit': 0.55,
          shelf: 0.5,
          'shoe-rack': 0.5,
          pantry: 0.8,
          wardrobe: 0.85,
        }[f.kind];
        const b = L.box(0.02, 0, 0.98, depth);
        this.shadowOf(b, 0.04);
        pen.rect(b, p.wood, 1, 0.04);
        pen.outline(b, p.woodDark, line, 1, 0.04);
        if (f.kind === 'shelf') {
          const n = Math.round(L.w * 6);
          for (let i = 0; i < n; i++) {
            const u = 0.06 + (i * 0.88) / n;
            pen.rect(L.box(u, 0.08, u + 0.7 / n, 0.85 * depth), p.books[i % p.books.length]!, 1);
          }
        }
        if (f.kind === 'shoe-rack') {
          for (const u of [0.28, 0.72]) {
            pen.ellipse(...L.pt(u - 0.07, depth * 0.55), 0.06, 0.06, p.woodDark);
            pen.ellipse(...L.pt(u + 0.07, depth * 0.55), 0.06, 0.06, p.woodDark);
          }
        }
        if (f.kind === 'wardrobe' || f.kind === 'pantry') {
          pen.line(...L.pt(0.5, 0.05), ...L.pt(0.5, depth), line * 1.2, p.woodDark);
          pen.circle(...L.pt(0.42, depth - 0.1), 0.035, p.woodDark);
          pen.circle(...L.pt(0.58, depth - 0.1), 0.035, p.woodDark);
        }
        break;
      }
      case 'chair': {
        const seat = L.box(0.24, 0.22, 0.76, 0.74);
        pen.rect(seat, p.woodLight, 1, 0.08);
        pen.outline(seat, p.woodDark, line, 1, 0.08);
        pen.rect(L.box(0.2, 0.1, 0.8, 0.22), p.woodDark, 1, 0.04);
        break;
      }
      case 'armchair':
      case 'sofa': {
        const b = inset(r, 0.06);
        this.shadowOf(b, 0.12);
        pen.rect(b, p.fabric, 1, 0.14);
        const arm = 0.18 / L.w;
        const back = 0.3;
        // Seat cushions between the arms, in front of the back rest.
        const n = f.kind === 'sofa' ? Math.max(1, Math.round(L.w)) : 1;
        const u0 = 0.03 + arm;
        const u1 = 0.97 - arm;
        for (let i = 0; i < n; i++) {
          const a = u0 + ((u1 - u0) * i) / n;
          const c = L.box(a + 0.01, back, a + (u1 - u0) / n - 0.01, 0.95);
          pen.rect(c, p.fabricLight, 1, 0.08);
        }
        pen.outline(b, p.woodDark, line, 0.35, 0.14);
        break;
      }
      case 'plant': {
        const [cx, cy] = [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2];
        pen.circle(cx + 0.03, cy + 0.05, 0.3, p.shadow, p.shadowAlpha);
        pen.circle(cx, cy, 0.26, p.pot);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          pen.circle(
            cx + Math.cos(a) * 0.17,
            cy + Math.sin(a) * 0.17,
            0.15,
            i % 2 ? p.leaf : p.leafDark,
          );
        }
        pen.circle(cx, cy, 0.12, p.leaf);
        break;
      }
      case 'floor-lamp': {
        const [cx, cy] = [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2];
        pen.circle(cx, cy, 0.34, p.lampShade, 0.9);
        pen.ring(cx, cy, 0.34, 0.03, p.woodDark, 0.6);
        break;
      }
      case 'fridge': {
        const b = L.box(0.04, 0, 0.96, 0.9);
        this.shadowOf(b, 0.05);
        pen.rect(b, p.white, 1, 0.05);
        pen.outline(b, p.whiteLine, line, 1, 0.05);
        pen.line(...L.pt(0.12, 0.8), ...L.pt(0.88, 0.8), 0.04, p.whiteLine);
        break;
      }
      case 'counter': {
        const b = L.box(0, 0, 1, 0.82);
        pen.rect(b, p.counter);
        pen.line(...L.pt(0, 0.82), ...L.pt(1, 0.82), 0.05, p.counterEdge);
        break;
      }
      case 'sink': {
        const b = L.box(0.1, 0.12, 0.9, 0.7);
        pen.rect(b, p.steel, 1, 0.1);
        pen.outline(b, p.whiteLine, line, 1, 0.1);
        pen.circle(...L.pt(0.5, 0.45), 0.05, p.whiteLine);
        pen.line(...L.pt(0.5, 0.02), ...L.pt(0.5, 0.2), 0.05, p.whiteLine);
        break;
      }
      case 'hob': {
        const b = L.box(0.1, 0.08, 0.9, 0.74);
        pen.rect(b, p.hob, 1, 0.06);
        for (const [u, v] of [
          [0.3, 0.25],
          [0.7, 0.25],
          [0.3, 0.57],
          [0.7, 0.57],
        ] as const) {
          pen.ring(...L.pt(u, v), 0.1, 0.03, p.burner);
        }
        break;
      }
      case 'table': {
        const b = inset(r, 0.1);
        this.shadowOf(b, 0.1);
        pen.rect(b, p.wood, 1, 0.1);
        pen.outline(b, p.woodDark, line, 1, 0.1);
        for (const [u, v] of [
          [0.25, 0.22],
          [0.75, 0.22],
          [0.25, 0.78],
          [0.75, 0.78],
        ] as const) {
          pen.circle(...L.pt(u, v), 0.16, p.white, 0.9);
        }
        break;
      }
      case 'bathtub': {
        const b = L.box(0, 0, 1, 0.92);
        this.shadowOf(b, 0.1);
        pen.rect(b, p.white, 1, 0.12);
        pen.outline(b, p.whiteLine, line, 1, 0.12);
        pen.rect(L.box(0.05, 0.14, 0.95, 0.8), p.water, 1, 0.2);
        pen.circle(...L.pt(0.08, 0.47), 0.05, p.whiteLine);
        break;
      }
      case 'toilet': {
        const tank = L.box(0.18, 0, 0.82, 0.3);
        this.shadowOf(inset(r, 0.1), 0.2);
        pen.rect(tank, p.white, 1, 0.05);
        pen.outline(tank, p.whiteLine, line, 1, 0.05);
        const [cx, cy] = L.pt(0.5, 0.6);
        const along = f.facing === 'left' || f.facing === 'right';
        pen.ellipse(cx, cy, along ? 0.3 : 0.25, along ? 0.25 : 0.3, p.white);
        pen.ellipse(cx, cy, along ? 0.19 : 0.15, along ? 0.15 : 0.19, p.water);
        break;
      }
      case 'basin': {
        const b = L.box(0.05, 0, 0.95, 0.72);
        this.shadowOf(b, 0.05);
        pen.rect(b, p.counter, 1, 0.05);
        pen.outline(b, p.counterEdge, line, 1, 0.05);
        const [cx, cy] = L.pt(0.5, 0.38);
        pen.circle(cx, cy, 0.24, p.white);
        pen.ring(cx, cy, 0.24, line, p.whiteLine);
        pen.circle(cx, cy, 0.04, p.whiteLine);
        break;
      }
      case 'mirror':
        pen.rect(L.box(0.12, 0, 0.88, 0.1), p.glass);
        pen.outline(L.box(0.12, 0, 0.88, 0.1), p.glassLine, line);
        break;
      case 'ac-unit':
      case 'heater-unit': {
        const b = f.kind === 'ac-unit' ? L.box(0.04, 0, 0.96, 0.34) : L.box(0.2, 0, 0.8, 0.42);
        this.shadowOf(b, 0.03);
        pen.rect(b, p.white, 1, 0.05);
        pen.outline(b, p.whiteLine, line, 1, 0.05);
        break;
      }
    }
  }
}

const STEPS: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = Math.ceil(a); i <= b; i++) out.push(i);
  return out;
}

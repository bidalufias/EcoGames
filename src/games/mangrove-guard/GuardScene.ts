import * as Phaser from 'phaser';
import { MANGROVE_RUBBISH, NURSERY_ANIMALS } from '../../content/mangroves';
import { seededRng } from '../../core/random';
import { imageUrl, type ImageName } from '../../ui/images';
import {
  COLS,
  Guard,
  HOUSES,
  LANES,
  SEA,
  SPECIES,
  WAVE_ENERGY,
  type Level,
  type MangroveEvent,
  type Plant,
  type PlantFailure,
  type SpeciesId,
  type Wave,
} from './logic';

export interface GuardHooks {
  onChange: (guard: Guard) => void;
  onEvent: (event: MangroveEvent, guard: Guard) => void;
  /** The player tried to plant or clear rubbish on a cell. */
  onAction: (result: ActionResult, guard: Guard) => void;
  onGameOver: (guard: Guard) => void;
}

export type ActionResult =
  | { kind: 'planted'; plant: Plant }
  | { kind: 'cleared'; lane: number; col: number }
  | { kind: 'failed'; reason: PlantFailure; species: SpeciesId };

export interface GuardOptions {
  dark: boolean;
  reducedMotion: boolean;
  /** Game pixels per CSS pixel, so text stays readable on sharp screens. */
  pixelRatio: number;
  /** For end-to-end tests: one ripple in each lane, then the end. */
  short?: boolean;
}

interface Palette {
  sea: number;
  seaLight: number;
  shallows: number;
  mud: number;
  mudDark: number;
  mudDot: number;
  lane: number;
  land: number;
  landDark: number;
  path: number;
  foam: number;
  root: number;
  cursor: number;
  flood: number;
  hpBack: number;
  hpGood: number;
  hpLow: number;
  good: string;
  bad: string;
  seed: string;
  textStroke: string;
}

const LIGHT: Palette = {
  sea: 0x3f95c8,
  seaLight: 0x62aede,
  shallows: 0x7fc0d9,
  mud: 0xb49a78,
  mudDark: 0xa68b68,
  mudDot: 0x957b5a,
  lane: 0xc9b393,
  land: 0x86b86a,
  landDark: 0x74a65a,
  path: 0xd8c7a2,
  foam: 0xffffff,
  root: 0x6b4a30,
  cursor: 0x0079c2,
  flood: 0x3f95c8,
  hpBack: 0x000000,
  hpGood: 0x2f9b5b,
  hpLow: 0xe0573f,
  good: '#1f8a4c',
  bad: '#cf3e2a',
  seed: '#2f9b5b',
  textStroke: '#ffffff',
};

const DARK: Palette = {
  sea: 0x1f4f75,
  seaLight: 0x2d628c,
  shallows: 0x2f6a86,
  mud: 0x5e5040,
  mudDark: 0x544737,
  mudDot: 0x4a3e30,
  lane: 0x6a5b49,
  land: 0x3d6a3b,
  landDark: 0x355d33,
  path: 0x6a604a,
  foam: 0xcfe3f0,
  root: 0xa27a58,
  cursor: 0x5aaef0,
  flood: 0x2d628c,
  hpBack: 0x000000,
  hpGood: 0x4cc184,
  hpLow: 0xf07f69,
  good: '#4cc184',
  bad: '#f07f69',
  seed: '#4cc184',
  textStroke: '#0d1117',
};

const FONT = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif';
/** Village land beyond the mudflat, in cells. */
const LAND = 1.4;
/** Length of a lane on screen, from the far sea to the village, in cells. */
const LENGTH = SEA + COLS + LAND;

interface PlantView {
  plant: Plant;
  img: Phaser.GameObjects.Image;
  roots: Phaser.GameObjects.Graphics;
  grown: boolean;
}

interface WaveView {
  wave: Wave;
  img: Phaser.GameObjects.Image;
}

/**
 * Mangrove Guard's coast, seen from above: the sea, a mudflat of LANES × COLS cells to
 * plant on, and a village. Wide screens put the sea on the left; tall screens put it at
 * the top. Rules live in logic.ts; this scene draws, handles pointer input and reports
 * back to the DOM through `hooks`.
 */
export class GuardScene extends Phaser.Scene {
  private hooks: GuardHooks;
  private palette: Palette;
  private opts: GuardOptions;
  guard: Guard;
  /** Species to plant, chosen in the DOM. */
  species: SpeciesId = 'api-api';
  private running = false;
  private lastTime = 0;
  /** The keyboard cursor, shown once the keyboard is used. */
  cursor = { lane: Math.floor(LANES / 2), col: COLS - 1 };
  private cursorShown = false;
  /** Cell under the mouse. */
  private hover: { lane: number; col: number } | null = null;
  private bg!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private houses: Phaser.GameObjects.Image[] = [];
  private plantViews = new Map<number, PlantView>();
  private waveViews = new Map<number, WaveView>();
  private rubbishViews = new Map<string, Phaser.GameObjects.Image>();

  constructor(hooks: GuardHooks, opts: GuardOptions) {
    super('mangrove-guard');
    this.hooks = hooks;
    this.palette = opts.dark ? DARK : LIGHT;
    this.opts = opts;
    this.guard = new Guard('easy', seededRng(1), { short: opts.short });
  }

  // ---------- Layout ----------

  /** Sea on the left (wide screens) or at the top (tall screens). */
  private get across(): boolean {
    return this.scale.width >= this.scale.height * 1.15;
  }
  /** Cell size in game pixels. */
  private get t(): number {
    const { width: W, height: H } = this.scale;
    return Math.floor(
      this.across ? Math.min(W / LENGTH, H / LANES) : Math.min(W / LANES, H / LENGTH),
    );
  }
  private get origin(): { x: number; y: number } {
    const { t } = this;
    const w = (this.across ? LENGTH : LANES) * t;
    const h = (this.across ? LANES : LENGTH) * t;
    return {
      x: Math.round((this.scale.width - w) / 2),
      y: Math.round((this.scale.height - h) / 2),
    };
  }
  /** Screen position of a point `x` along a lane (0 = the village's edge). */
  private pos(lane: number, x: number): { x: number; y: number } {
    const { t, origin } = this;
    const a = (SEA + COLS - x) * t;
    const b = (lane + 0.5) * t;
    return this.across
      ? { x: origin.x + a, y: origin.y + b }
      : { x: origin.x + b, y: origin.y + a };
  }
  private cellCenter(lane: number, col: number): { x: number; y: number } {
    return this.pos(lane, col + 0.5);
  }
  /** The mudflat cell under a screen point, if any. */
  private cellAt(px: number, py: number): { lane: number; col: number } | null {
    const { t, origin } = this;
    const a = ((this.across ? px - origin.x : py - origin.y) / t) as number;
    const b = ((this.across ? py - origin.y : px - origin.x) / t) as number;
    const lane = Math.floor(b);
    const col = Math.floor(SEA + COLS - a);
    if (lane < 0 || lane >= LANES || col < 0 || col >= COLS) return null;
    return { lane, col };
  }
  private font(cells: number, minCss: number): number {
    return Math.round(Math.max(this.t * cells, minCss * this.opts.pixelRatio));
  }

  preload(): void {
    const names = new Set<ImageName>([
      'seedling',
      'tree',
      'wave',
      'house',
      ...MANGROVE_RUBBISH,
      ...NURSERY_ANIMALS,
    ]);
    for (const name of names) this.load.image(`img-${name}`, imageUrl(name));
  }

  create(): void {
    this.bg = this.add.graphics().setDepth(0);
    this.fx = this.add.graphics().setDepth(8);
    this.houses = Array.from({ length: HOUSES }, () =>
      this.add.image(0, 0, 'img-house').setDepth(3),
    );
    this.layout();

    this.scale.on('resize', this.layout, this);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.hover = p.wasTouch ? null : this.cellAt(p.x, p.y);
    });
    this.input.on('gameout', () => (this.hover = null));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
    });
  }

  /** Starts (or restarts) a game. Called from the DOM. */
  startGame(level: Level, seed: number): void {
    this.guard = new Guard(level, seededRng(seed), { short: this.opts.short });
    for (const v of this.plantViews.values()) this.destroyPlant(v);
    for (const v of this.waveViews.values()) v.img.destroy();
    for (const img of this.rubbishViews.values()) img.destroy();
    this.plantViews.clear();
    this.waveViews.clear();
    this.rubbishViews.clear();
    this.running = true;
    this.cursor = { lane: Math.floor(LANES / 2), col: COLS - 1 };
    this.layout();
    this.hooks.onChange(this.guard);
  }

  stop(): void {
    this.running = false;
  }

  /**
   * Keyboard: moves the cursor one cell in a screen direction. With the sea on the left,
   * left is towards the sea; with the sea at the top, up is.
   */
  moveCursor(dir: 'up' | 'down' | 'left' | 'right'): void {
    this.cursorShown = true;
    const seaward = this.across ? 'left' : 'up';
    const landward = this.across ? 'right' : 'down';
    const back = this.across ? 'up' : 'left';
    let { lane, col } = this.cursor;
    if (dir === seaward) col++;
    else if (dir === landward) col--;
    else if (dir === back) lane--;
    else lane++;
    this.cursor = {
      lane: Phaser.Math.Clamp(lane, 0, LANES - 1),
      col: Phaser.Math.Clamp(col, 0, COLS - 1),
    };
  }

  /** Keyboard: plant, or clear rubbish, at the cursor. */
  actAtCursor(): void {
    this.cursorShown = true;
    this.act(this.cursor.lane, this.cursor.col);
  }

  /** Where the cursor is, for the DOM to describe it. */
  describeCursor(): { lane: number; col: number; plant?: Plant; rubbish: boolean } {
    const { lane, col } = this.cursor;
    return {
      lane,
      col,
      plant: this.guard.plantAt(lane, col),
      rubbish: this.guard.hasRubbish(lane, col),
    };
  }

  /** Test hook: cells and objects in game coordinates. */
  debugSnapshot() {
    const g = this.guard;
    return {
      cell: (lane: number, col: number) => this.cellCenter(lane, col),
      across: this.across,
      plants: g.plants.map((p) => ({
        lane: p.lane,
        col: p.col,
        species: p.species,
        grown: p.grown,
      })),
      waves: g.waves.map((w) => ({ lane: w.lane, x: w.x, energy: w.energy })),
      rubbish: [...g.rubbish],
      seedlings: g.seedlings,
      houses: g.houses,
    };
  }

  override update(time: number): void {
    const delta = Math.min(Math.max(time - this.lastTime, 0), 100);
    this.lastTime = time;
    if (this.running) {
      for (const e of this.guard.tick(delta)) this.handleEvent(e);
      this.hooks.onChange(this.guard);
      if (this.guard.finished) {
        this.running = false;
        this.time.delayedCall(1100, () => this.hooks.onGameOver(this.guard));
      }
    }
    this.syncPlants(time);
    this.syncWaves(time);
    this.syncRubbish();
    this.drawFx(time);
  }

  // ---------- Input ----------

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (!this.running) return;
    const cell = this.cellAt(p.x, p.y);
    if (!cell) return;
    this.cursorShown = false;
    this.cursor = cell;
    this.act(cell.lane, cell.col);
  }

  private act(lane: number, col: number): void {
    if (!this.running) return;
    const g = this.guard;
    if (g.hasRubbish(lane, col)) {
      if (g.clearRubbish(lane, col)) {
        this.popRubbish(lane, col);
        this.hooks.onAction({ kind: 'cleared', lane, col }, g);
      }
      return;
    }
    if (g.plantAt(lane, col)) return;
    const result = g.plant(lane, col, this.species);
    if (typeof result === 'string') {
      this.hooks.onAction({ kind: 'failed', reason: result, species: this.species }, g);
      if (result === 'cost')
        this.floatText('Need more seedlings', this.palette.bad, this.cellCenter(lane, col));
      return;
    }
    this.hooks.onAction({ kind: 'planted', plant: result }, g);
  }

  // ---------- Drawing ----------

  /** Draws the coast; runs on start and on every resize. */
  private layout(): void {
    const { t, palette: p } = this;
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.bg;
    g.clear();
    // Bands along the lanes, stretched across the whole canvas.
    const band = (from: number, to: number, color: number, alpha = 1) => {
      const a = this.pos(0, from);
      const b = this.pos(0, to);
      g.fillStyle(color, alpha);
      if (this.across) g.fillRect(Math.min(a.x, b.x), 0, Math.abs(b.x - a.x), H);
      else g.fillRect(0, Math.min(a.y, b.y), W, Math.abs(b.y - a.y));
    };
    const far = LENGTH * 2;
    band(COLS + far, COLS, p.sea);
    band(COLS + SEA * 0.45, COLS, p.seaLight);
    band(COLS, 0, p.mud);
    band(0, -far, p.land);
    // Shallow water washing over the seaward edge of the mud.
    band(COLS, COLS - 0.35, p.shallows, 0.55);
    // A checker of slightly darker cells, and lane lines, on the mudflat.
    for (let lane = 0; lane < LANES; lane++) {
      for (let col = 0; col < COLS; col++) {
        if ((lane + col) % 2) continue;
        const c = this.cellCenter(lane, col);
        g.fillStyle(p.mudDark, 1).fillRect(c.x - t / 2, c.y - t / 2, t, t);
      }
    }
    g.fillStyle(p.mudDot, 1);
    for (let lane = 0; lane < LANES; lane++) {
      for (let i = 0; i < COLS * 4; i++) {
        const x = (i + 0.5) / 4 + Math.sin(i * 12.9 + lane * 78.2) * 0.1;
        const off = Math.sin(i * 4.3 + lane * 3.1) * 0.38;
        const c = this.pos(lane + off, x);
        g.fillCircle(c.x, c.y, Math.max(1.5, t * 0.025));
      }
    }
    g.lineStyle(Math.max(1, t * 0.02), p.lane, 0.7);
    for (let lane = 1; lane < LANES; lane++) {
      const a = this.pos(lane - 0.5, COLS);
      const b = this.pos(lane - 0.5, 0);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
    // A path through the village, and a house at the end of each lane.
    const pathA = this.pos(-0.5, -LAND * 0.25);
    const pathB = this.pos(LANES - 0.5, -LAND * 0.25);
    g.fillStyle(p.landDark, 1);
    for (let lane = 0; lane < LANES; lane++) {
      const c = this.pos(lane, -LAND * 0.62);
      g.fillEllipse(c.x, c.y + t * 0.22, t * 0.7, t * 0.22);
    }
    g.lineStyle(t * 0.14, p.path, 1).lineBetween(pathA.x, pathA.y, pathB.x, pathB.y);
    this.houses.forEach((img, lane) => {
      const c = this.pos(lane, -LAND * 0.62);
      img.setPosition(c.x, c.y).setDisplaySize(t * 0.72, t * 0.72);
    });
    for (const v of this.plantViews.values()) this.placePlant(v);
    for (const [k, img] of this.rubbishViews) {
      const [lane, col] = k.split(',').map(Number) as [number, number];
      this.placeRubbish(img, lane, col);
    }
  }

  private syncPlants(time: number): void {
    const seen = new Set<number>();
    for (const plant of this.guard.plants) {
      seen.add(plant.id);
      let v = this.plantViews.get(plant.id);
      if (!v) {
        v = {
          plant,
          img: this.add.image(0, 0, 'img-seedling').setDepth(5),
          roots: this.add.graphics().setDepth(4),
          grown: false,
        };
        this.plantViews.set(plant.id, v);
        this.placePlant(v);
        if (!this.opts.reducedMotion) {
          const s = v.img.scale;
          v.img.setScale(s * 0.3);
          this.tweens.add({ targets: v.img, scale: s, duration: 260, ease: 'Back.Out' });
        }
      }
      if (v.grown !== plant.grown) {
        v.grown = plant.grown;
        v.img.setTexture(plant.grown ? 'img-tree' : 'img-seedling');
        this.placePlant(v);
      }
      // A gentle sway, and a tint while rubbish is caught in the roots.
      const sway = this.opts.reducedMotion ? 0 : Math.sin(time / 700 + plant.id) * 2;
      v.img.setAngle(sway);
      if (this.guard.hasRubbish(plant.lane, plant.col)) v.img.setTint(0xb7b7a0);
      else v.img.clearTint();
    }
    for (const [id, v] of this.plantViews) {
      if (seen.has(id)) continue;
      this.plantViews.delete(id);
      this.uproot(v);
    }
  }

  /** Sizes a plant for its growth, and draws its roots. */
  private placePlant(v: PlantView): void {
    const { t, palette: p } = this;
    const { plant } = v;
    const c = this.cellCenter(plant.lane, plant.col);
    const bakau = plant.species === 'bakau';
    const size = plant.grown ? t * (bakau ? 0.9 : 0.74) : t * (bakau ? 0.5 : 0.44);
    v.img.setPosition(c.x, c.y - t * (plant.grown ? 0.14 : 0.06)).setDisplaySize(size, size);
    const r = v.roots;
    r.clear();
    if (!plant.grown) return;
    const w = Math.max(2, t * 0.035);
    r.lineStyle(w, p.root, 1);
    if (bakau) {
      // Bakau: arching stilt roots all round the trunk.
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * 0.95 + (i / 5) * Math.PI * 0.9;
        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(c.x, c.y + t * 0.12),
          new Phaser.Math.Vector2(c.x + Math.cos(a) * t * 0.3, c.y - t * 0.02),
          new Phaser.Math.Vector2(c.x + Math.cos(a) * t * 0.42, c.y + t * 0.36),
        );
        curve.draw(r, 12);
      }
    } else {
      // Api-api: little pencil roots poking up out of the mud around it.
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        const x = c.x + Math.cos(a) * t * 0.36;
        const y = c.y + t * 0.18 + Math.sin(a) * t * 0.16;
        r.lineBetween(x, y, x, y - t * 0.1);
      }
    }
  }

  private destroyPlant(v: PlantView): void {
    v.img.destroy();
    v.roots.destroy();
  }

  /** A wave tore a mangrove out: it tips over and washes away. */
  private uproot(v: PlantView): void {
    v.roots.destroy();
    if (this.opts.reducedMotion) {
      v.img.destroy();
      return;
    }
    this.tweens.add({
      targets: v.img,
      angle: 80,
      alpha: 0,
      duration: 500,
      ease: 'Quad.In',
      onComplete: () => v.img.destroy(),
    });
  }

  private syncWaves(time: number): void {
    const { t } = this;
    const seen = new Set<number>();
    for (const wave of this.guard.waves) {
      seen.add(wave.id);
      let v = this.waveViews.get(wave.id);
      if (!v) {
        v = { wave, img: this.add.image(0, 0, 'img-wave').setDepth(6) };
        this.waveViews.set(wave.id, v);
      }
      // Bigger, stronger waves look bigger, and they shrink as the mangroves calm them.
      const size = t * (0.45 + 0.55 * (wave.energy / WAVE_ENERGY.storm));
      const bob = this.opts.reducedMotion ? 0 : Math.sin(time / 180 + wave.id) * t * 0.03;
      const c = this.pos(wave.lane, wave.x + 0.25);
      v.img
        .setPosition(c.x, c.y + bob)
        .setDisplaySize(size, size)
        .setFlipX(this.across)
        .setAlpha(0.6 + 0.4 * (wave.energy / wave.maxEnergy));
    }
    for (const [id, v] of this.waveViews) {
      if (seen.has(id)) continue;
      this.waveViews.delete(id);
      if (this.opts.reducedMotion) v.img.destroy();
      else
        this.tweens.add({
          targets: v.img,
          alpha: 0,
          scale: v.img.scale * 1.3,
          duration: 300,
          onComplete: () => v.img.destroy(),
        });
    }
  }

  private syncRubbish(): void {
    for (const k of this.guard.rubbish) {
      if (this.rubbishViews.has(k)) continue;
      const [lane, col] = k.split(',').map(Number) as [number, number];
      const name = MANGROVE_RUBBISH[(lane * 3 + col) % MANGROVE_RUBBISH.length]!;
      const img = this.add.image(0, 0, `img-${name}`).setDepth(7);
      this.placeRubbish(img, lane, col);
      this.rubbishViews.set(k, img);
    }
    for (const [k, img] of this.rubbishViews) {
      if (this.guard.rubbish.has(k)) continue;
      this.rubbishViews.delete(k);
      img.destroy();
    }
  }

  private placeRubbish(img: Phaser.GameObjects.Image, lane: number, col: number): void {
    const c = this.cellCenter(lane, col);
    img
      .setPosition(c.x + this.t * 0.22, c.y + this.t * 0.2)
      .setDisplaySize(this.t * 0.42, this.t * 0.42)
      .setAngle(((lane * 7 + col * 13) % 5) * 12 - 24);
  }

  /** Foam on the waves, strength bars, flooded houses and the cursor. */
  private drawFx(time: number): void {
    const { t, palette: p } = this;
    const g = this.fx;
    g.clear();
    // A swell of water across the lane behind each wave's front, edged with foam: half
    // an ellipse bulging towards the village.
    for (const w of this.guard.waves) {
      const power = 0.35 + 0.65 * (w.energy / WAVE_ENERGY.storm);
      const depth = t * 0.55 * power;
      const base = this.pos(w.lane, w.x + depth / t);
      const wob = this.opts.reducedMotion ? 0 : Math.sin(time / 150 + w.id) * t * 0.03;
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI;
        const across = -Math.cos(a) * t * 0.44;
        const along = Math.sin(a) * (depth + wob);
        pts.push(
          this.across
            ? new Phaser.Math.Vector2(base.x + along, base.y + across)
            : new Phaser.Math.Vector2(base.x + across, base.y + along),
        );
      }
      g.fillStyle(p.sea, 0.4).fillPoints(pts, true);
      g.lineStyle(Math.max(2, t * 0.035), p.foam, 0.85).strokePoints(pts, false);
    }
    // Strength bars on damaged mangroves.
    for (const plant of this.guard.plants) {
      const max = SPECIES[plant.species].hp[plant.grown ? 1 : 0];
      if (plant.hp >= max) continue;
      const c = this.cellCenter(plant.lane, plant.col);
      const w = t * 0.6;
      const share = Math.max(0, plant.hp / max);
      g.fillStyle(p.hpBack, 0.35).fillRoundedRect(
        c.x - w / 2,
        c.y + t * 0.36,
        w,
        t * 0.07,
        t * 0.03,
      );
      g.fillStyle(share > 0.4 ? p.hpGood : p.hpLow, 1);
      g.fillRoundedRect(
        c.x - w / 2,
        c.y + t * 0.36,
        Math.max(t * 0.06, w * share),
        t * 0.07,
        t * 0.03,
      );
    }
    // Water around flooded houses.
    for (const lane of this.guard.flooded) {
      const c = this.pos(lane, -LAND * 0.62);
      g.fillStyle(p.flood, 0.45).fillEllipse(c.x, c.y + t * 0.24, t * 0.95, t * 0.34);
    }
    this.houses.forEach((img, lane) => img.setAlpha(this.guard.flooded.has(lane) ? 0.7 : 1));
    // The cursor (keyboard), or the cell under the mouse.
    const cell = this.cursorShown ? this.cursor : this.hover;
    if (cell && this.running) {
      const c = this.cellCenter(cell.lane, cell.col);
      const ok =
        !this.guard.canPlant(cell.lane, cell.col, this.species) ||
        this.guard.hasRubbish(cell.lane, cell.col);
      g.lineStyle(Math.max(3, t * 0.05), ok ? p.cursor : p.hpLow, this.cursorShown ? 1 : 0.7);
      g.strokeRoundedRect(c.x - t * 0.46, c.y - t * 0.46, t * 0.92, t * 0.92, t * 0.12);
    }
  }

  // ---------- Feedback ----------

  private handleEvent(e: MangroveEvent): void {
    const p = this.palette;
    switch (e.kind) {
      case 'hit':
        this.splash(e.plant.lane, e.plant.col);
        if (!e.uprooted) this.shake(e.plant.id);
        break;
      case 'broken':
        this.floatText(`+${e.points}`, p.good, this.cellCenter(e.wave.lane, e.col));
        break;
      case 'flood':
        this.floatText(
          e.houses > 1 ? 'Big flood!' : 'Flooded!',
          p.bad,
          this.pos(e.wave.lane, -LAND * 0.62),
        );
        if (!this.opts.reducedMotion) this.cameras.main.shake(220, 0.006);
        break;
      case 'drop':
        this.floatText('+1 seedling', p.seed, this.cellCenter(e.plant.lane, e.plant.col), 0.2);
        break;
      case 'fish':
        this.jump(e.plant);
        break;
      case 'grown': {
        const v = this.plantViews.get(e.plant.id);
        if (v && !this.opts.reducedMotion) {
          const s = v.img.scale;
          this.tweens.add({ targets: v.img, scale: s * 1.15, duration: 140, yoyo: true });
        }
        break;
      }
      default:
        break;
    }
    this.hooks.onEvent(e, this.guard);
  }

  private shake(plantId: number): void {
    const v = this.plantViews.get(plantId);
    if (!v || this.opts.reducedMotion) return;
    this.tweens.add({
      targets: v.img,
      x: v.img.x + this.t * 0.05,
      duration: 60,
      yoyo: true,
      repeat: 2,
    });
  }

  /** Spray where a wave meets a mangrove. */
  private splash(lane: number, col: number): void {
    if (this.opts.reducedMotion) return;
    const c = this.cellCenter(lane, col);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const drop = this.add
        .circle(c.x, c.y, Math.max(3, this.t * 0.05), this.palette.foam, 0.9)
        .setDepth(9);
      this.tweens.add({
        targets: drop,
        x: c.x + Math.cos(a) * this.t * 0.45,
        y: c.y + Math.sin(a) * this.t * 0.45,
        alpha: 0,
        duration: 420,
        ease: 'Quad.Out',
        onComplete: () => drop.destroy(),
      });
    }
  }

  /** A young fish (or prawn, or crab) pops up among the roots of a grown mangrove. */
  private jump(plant: Plant): void {
    const c = this.cellCenter(plant.lane, plant.col);
    const name = NURSERY_ANIMALS[plant.id % NURSERY_ANIMALS.length]!;
    const img = this.add
      .image(c.x - this.t * 0.25, c.y + this.t * 0.2, `img-${name}`)
      .setDisplaySize(this.t * 0.34, this.t * 0.34)
      .setDepth(9);
    this.tweens.add({
      targets: img,
      y: c.y - this.t * 0.35,
      alpha: 0,
      duration: this.opts.reducedMotion ? 400 : 1100,
      ease: 'Quad.Out',
      onComplete: () => img.destroy(),
    });
  }

  private popRubbish(lane: number, col: number): void {
    const c = this.cellCenter(lane, col);
    this.floatText('Cleared!', this.palette.good, c);
  }

  private floatText(text: string, color: string, at: { x: number; y: number }, size = 0.28): void {
    const label = this.add
      .text(at.x, at.y - this.t * 0.3, text, {
        fontFamily: FONT,
        fontStyle: '800',
        fontSize: `${this.font(size, 13)}px`,
        color,
        stroke: this.palette.textStroke,
        strokeThickness: Math.max(3, this.t * 0.08),
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: label,
      y: at.y - this.t * 1.1,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.Out',
      onComplete: () => label.destroy(),
    });
  }
}

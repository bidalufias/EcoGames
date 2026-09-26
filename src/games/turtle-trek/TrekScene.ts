import * as Phaser from 'phaser';
import { BEACH_RUBBISH, GHOST_CRAB } from '../../content/turtles';
import { seededRng } from '../../core/random';
import { imageUrl, type ImageName } from '../../ui/images';
import {
  COLS,
  HATCHLINGS,
  LIGHT_COLS,
  NEST_COL,
  ROWS,
  STEP_MS,
  Trek,
  type Dir,
  type Level,
  type Light,
  type TrekEvent,
} from './logic';

export interface TrekHooks {
  onChange: (trek: Trek) => void;
  onEvent: (event: TrekEvent, trek: Trek) => void;
  onGameOver: (trek: Trek) => void;
}

export interface TrekOptions {
  dark: boolean;
  reducedMotion: boolean;
  /** Game pixels per CSS pixel, so text stays readable on sharp screens. */
  pixelRatio: number;
  /** For end-to-end tests: a shorter night, and no crabs. */
  trekMs?: number;
  calm?: boolean;
}

interface Palette {
  dune: number;
  grass: number;
  sand: number;
  sandDot: number;
  wet: number;
  sea: number;
  seaDeep: number;
  foam: number;
  night: number;
  nightAlpha: number;
  outside: number;
  outsideAlpha: number;
  pole: number;
  glow: number;
  lampOff: number;
  nest: number;
  nestRim: number;
  track: number;
  good: string;
  bad: string;
  textStroke: string;
}

const LIGHT: Palette = {
  dune: 0xe3d3a4,
  grass: 0x6aa35a,
  sand: 0xf6e7c4,
  sandDot: 0xe2cda0,
  wet: 0xdcc59a,
  sea: 0x3f95c8,
  seaDeep: 0x2f78ab,
  foam: 0xffffff,
  night: 0x24306b,
  nightAlpha: 0.1,
  outside: 0x24306b,
  outsideAlpha: 0.1,
  pole: 0x4b5563,
  glow: 0xffd66b,
  lampOff: 0x9aa3ad,
  nest: 0xd8bd8a,
  nestRim: 0xc2a26d,
  track: 0xd8c092,
  good: '#1f8a4c',
  bad: '#cf3e2a',
  textStroke: '#ffffff',
};

const DARK: Palette = {
  dune: 0x5d563f,
  grass: 0x3d6a3b,
  sand: 0x7d7258,
  sandDot: 0x6c624b,
  wet: 0x675d47,
  sea: 0x1f4f75,
  seaDeep: 0x153c5c,
  foam: 0xcfe3f0,
  night: 0x000814,
  nightAlpha: 0.3,
  outside: 0x000000,
  outsideAlpha: 0.25,
  pole: 0x9aa3ad,
  glow: 0xf2bf4f,
  lampOff: 0x4b5563,
  nest: 0x6e6248,
  nestRim: 0x585038,
  track: 0x6a604a,
  good: '#4cc184',
  bad: '#f07f69',
  textStroke: '#0d1117',
};

const FONT = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif';

interface LampView {
  light: Light;
  glow: Phaser.GameObjects.Ellipse;
  ring: Phaser.GameObjects.Ellipse;
  head: Phaser.GameObjects.Image;
}

/**
 * Turtle Trek play field: a beach at night seen from above, from the dunes at the top
 * to the sea at the bottom. Rules live in logic.ts; this scene draws, handles pointer
 * input and reports back to the DOM through `hooks`.
 */
export class TrekScene extends Phaser.Scene {
  private hooks: TrekHooks;
  private palette: Palette;
  private opts: TrekOptions;
  trek: Trek;
  private running = false;
  private lastTime = 0;
  /** Keyboard direction held down, set by the DOM. */
  heldDir: Dir | null = null;
  private pointerAt: { x: number; y: number } | null = null;
  private nextStepAt = 0;
  private bg!: Phaser.GameObjects.Graphics;
  private water!: Phaser.GameObjects.Graphics;
  private night!: Phaser.GameObjects.Graphics;
  private poles!: Phaser.GameObjects.Graphics;
  private lamps: LampView[] = [];
  private rubbish: Phaser.GameObjects.Image[] = [];
  private crabs: Phaser.GameObjects.Image[] = [];
  private hatchling!: Phaser.GameObjects.Image;
  private hatchShadow!: Phaser.GameObjects.Ellipse;
  /** Where the hatchling is drawn, easing towards its cell. */
  private drawn = { x: NEST_COL, y: 0 };
  private facing: -1 | 1 = 1;
  private nestDots: Phaser.GameObjects.Image[] = [];

  constructor(hooks: TrekHooks, opts: TrekOptions) {
    super('turtle-trek');
    this.hooks = hooks;
    this.palette = opts.dark ? DARK : LIGHT;
    this.opts = opts;
    this.trek = new Trek('easy', seededRng(1), { trekMs: opts.trekMs, calm: opts.calm });
  }

  // ---------- Layout ----------

  /** Cell size in game pixels. */
  private get t(): number {
    return Math.floor(Math.min(this.scale.width / COLS, this.scale.height / ROWS));
  }
  private get origin(): { x: number; y: number } {
    return {
      x: Math.round((this.scale.width - this.t * COLS) / 2),
      y: Math.round((this.scale.height - this.t * ROWS) / 2),
    };
  }
  /** Middle of a cell (col and row may be fractional) on screen. */
  private toScreen(col: number, row: number): { x: number; y: number } {
    const { t, origin } = this;
    return { x: origin.x + (col + 0.5) * t, y: origin.y + (row + 0.5) * t };
  }
  private font(cells: number, minCss: number): number {
    return Math.round(Math.max(this.t * cells, minCss * this.opts.pixelRatio));
  }

  preload(): void {
    const names = new Set<ImageName>([
      'turtle',
      GHOST_CRAB.image,
      'lightbulb',
      ...BEACH_RUBBISH.map((r) => r.image),
    ]);
    for (const name of names) this.load.image(`img-${name}`, imageUrl(name));
  }

  create(): void {
    this.bg = this.add.graphics().setDepth(0);
    this.water = this.add.graphics().setDepth(1);
    this.night = this.add.graphics().setDepth(2);
    this.poles = this.add.graphics().setDepth(6);
    this.hatchShadow = this.add.ellipse(0, 0, 10, 4, 0x000000, 0.2).setDepth(4);
    this.hatchling = this.add.image(0, 0, 'img-turtle').setDepth(5);
    for (let i = 0; i < HATCHLINGS; i++) {
      this.nestDots.push(this.add.image(0, 0, 'img-turtle').setDepth(3));
    }
    this.buildBeach();
    this.layout();

    this.scale.on('resize', this.layout, this);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.pointerAt && p.isDown) this.pointerAt = { x: p.x, y: p.y };
    });
    this.input.on('pointerup', () => (this.pointerAt = null));
    this.input.on('pointerupoutside', () => (this.pointerAt = null));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
    });
  }

  /** Starts (or restarts) a night on the beach. Called from the DOM. */
  startTrek(level: Level, seed: number): void {
    this.trek = new Trek(level, seededRng(seed), {
      trekMs: this.opts.trekMs,
      calm: this.opts.calm,
    });
    this.running = true;
    this.pointerAt = null;
    this.drawn = { x: NEST_COL, y: 0 };
    this.buildBeach();
    this.layout();
    this.hooks.onChange(this.trek);
  }

  stop(): void {
    this.running = false;
    this.pointerAt = null;
  }

  /** Keyboard: switch off the lit light nearest the hatchling. */
  switchOffLight(): void {
    if (!this.running) return;
    const light = this.trek.switchOff();
    if (light) this.lightOff(light);
  }

  /** Test hook: the beach in game coordinates. */
  debugSnapshot() {
    const tr = this.trek;
    return {
      hatchling: { ...tr.hatchling, ...this.toScreen(tr.hatchling.col, tr.hatchling.row) },
      lanes: tr.lanes,
      rubbish: [...tr.rubbish.keys()].map((k) => k.split(',').map(Number) as [number, number]),
      crabs: tr.crabs.map((c) => ({ row: c.row, x: c.x })),
      lights: tr.lights.map((l) => ({ col: l.col, on: l.on, ...this.toScreen(l.col, 0) })),
      saved: tr.saved,
      score: tr.score,
    };
  }

  override update(time: number): void {
    const delta = Math.min(Math.max(time - this.lastTime, 0), 100);
    this.lastTime = time;
    if (this.running) {
      this.handleInput(time);
      for (const e of this.trek.tick(delta)) this.handleEvent(e);
      this.hooks.onChange(this.trek);
      if (this.trek.finished) {
        this.running = false;
        this.pointerAt = null;
        this.time.delayedCall(900, () => this.hooks.onGameOver(this.trek));
      }
    }
    this.syncHatchling(delta, time);
    this.syncCrabs(time);
    this.syncLamps(time);
    this.drawWater(time);
    this.drawNight();
  }

  // ---------- Input ----------

  private handleInput(time: number): void {
    if (time < this.nextStepAt) return;
    let dir = this.heldDir;
    if (!dir && this.pointerAt) {
      const h = this.toScreen(this.trek.hatchling.col, this.trek.hatchling.row);
      const dx = this.pointerAt.x - h.x;
      const dy = this.pointerAt.y - h.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > this.t * 0.5) {
        dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      }
    }
    if (!dir) return;
    this.nextStepAt = time + STEP_MS;
    if (dir === 'left') this.facing = -1;
    if (dir === 'right') this.facing = 1;
    for (const e of this.trek.step(dir)) this.handleEvent(e);
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (!this.running) return;
    // Tapping a lit light switches it off.
    for (const v of this.lamps) {
      const c = this.toScreen(v.light.col, 0);
      if (v.light.on && Math.hypot(p.x - c.x, p.y - c.y) < this.t * 0.9) {
        const light = this.trek.switchOff(v.light.col);
        if (light) this.lightOff(light);
        return;
      }
    }
    this.pointerAt = { x: p.x, y: p.y };
    this.nextStepAt = 0;
  }

  // ---------- Drawing ----------

  /** Rubbish and crab sprites for the current trek; lamps once. */
  private buildBeach(): void {
    for (const r of this.rubbish) r.destroy();
    for (const c of this.crabs) c.destroy();
    this.rubbish = [...this.trek.rubbish.entries()].map(([key, item]) => {
      const [row, col] = key.split(',').map(Number) as [number, number];
      return this.add.image(0, 0, `img-${item.image}`).setDepth(3).setData('cell', { row, col });
    });
    this.crabs = this.trek.crabs.map(() =>
      this.add.image(0, 0, `img-${GHOST_CRAB.image}`).setDepth(4),
    );
    if (this.lamps.length === 0) {
      this.lamps = LIGHT_COLS.map((_, i) => {
        const glow = this.add.ellipse(0, 0, 10, 10, this.palette.glow, 0.28).setDepth(2.5);
        const ring = this.add.ellipse(0, 0, 10, 10).setDepth(7);
        const head = this.add.image(0, 0, 'img-lightbulb').setDepth(7);
        return { light: this.trek.lights[i]!, glow, ring, head };
      });
    }
    this.lamps.forEach((v, i) => (v.light = this.trek.lights[i]!));
  }

  private layout(): void {
    const { t, palette: p, origin } = this;
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.bg;
    g.clear();
    const rowY = (row: number) => origin.y + row * t;
    // Dunes above the nest row's middle, dry sand, wet sand, then the sea (drawn live).
    g.fillStyle(p.dune, 1).fillRect(0, 0, W, rowY(0.6));
    g.fillStyle(p.sand, 1).fillRect(0, rowY(0.6), W, rowY(ROWS - 2) - rowY(0.6));
    g.fillStyle(p.wet, 1).fillRect(0, rowY(ROWS - 2), W, H - rowY(ROWS - 2));
    // A wavy edge where the dunes meet the sand, with tufts of grass.
    g.fillStyle(p.dune, 1);
    for (let x = -t; x < W + t; x += t * 0.9) {
      g.fillEllipse(x, rowY(0.6), t * 1.1, t * 0.5);
    }
    // Tufts of grass all over the dunes (tall screens have lots of dune above the nest).
    g.fillStyle(p.grass, 1);
    const tufts: [number, number][] = [];
    for (let y = rowY(0.25), band = 0; y > -t; y -= t * 0.8, band++) {
      for (let x = t * 0.2 + (band % 2) * t * 0.36; x < W; x += t * 0.73) {
        tufts.push([x + Math.sin(x * 3.1 + band) * t * 0.12, y + Math.sin(x * 0.7) * t * 0.14]);
      }
    }
    for (const [x, y] of tufts) {
      for (const [dx, h] of [
        [-0.08, 0.22],
        [0, 0.3],
        [0.08, 0.2],
      ] as const) {
        g.fillTriangle(
          x + dx * t - t * 0.03,
          y,
          x + dx * t + t * 0.03,
          y,
          x + dx * t * 1.8,
          y - h * t,
        );
      }
    }
    // Speckles in the sand, and little crab tracks along the crab rows.
    g.fillStyle(p.sandDot, 1);
    for (let row = 1; row < ROWS - 2; row++) {
      for (let x = (row * 37) % 23; x < W; x += t * 0.55) {
        const jitter = Math.sin(x * 12.9 + row * 78.2) * 0.5 + 0.5;
        g.fillCircle(x, rowY(row) + jitter * t, Math.max(1, t * 0.025));
      }
      if (this.trek.lanes[row] === 'crabs') {
        g.fillStyle(p.track, 1);
        for (let x = 0; x < W; x += t * 0.3) {
          g.fillCircle(x, rowY(row + 0.42), Math.max(1, t * 0.03));
          g.fillCircle(x + t * 0.15, rowY(row + 0.58), Math.max(1, t * 0.03));
        }
        g.fillStyle(p.sandDot, 1);
      }
    }
    // The nest: a hollow in the sand at the top of the beach.
    const nest = this.toScreen(NEST_COL, 0);
    g.fillStyle(p.nestRim, 1).fillEllipse(nest.x, nest.y + t * 0.05, t * 1.5, t * 0.95);
    g.fillStyle(p.nest, 1).fillEllipse(nest.x, nest.y + t * 0.1, t * 1.25, t * 0.72);

    // Outside the play columns is a little darker, so the path to the sea stands out.
    g.fillStyle(p.outside, p.outsideAlpha);
    g.fillRect(0, 0, origin.x, H);
    g.fillRect(origin.x + COLS * t, 0, W - origin.x - COLS * t, H);

    // Lamp posts on the dunes.
    const pg = this.poles;
    pg.clear();
    for (const col of LIGHT_COLS) {
      const c = this.toScreen(col, 0);
      pg.fillStyle(0x000000, 0.18).fillEllipse(c.x + t * 0.1, c.y + t * 0.36, t * 0.5, t * 0.16);
      pg.fillStyle(p.pole, 1).fillRoundedRect(
        c.x - t * 0.05,
        c.y - t * 0.05,
        t * 0.1,
        t * 0.42,
        t * 0.04,
      );
    }
    for (const v of this.lamps) {
      const c = this.toScreen(v.light.col, 0);
      v.head.setPosition(c.x, c.y - t * 0.12).setDisplaySize(t * 0.62, t * 0.62);
      v.glow.setPosition(c.x, c.y + t * 0.6).setSize(t * 5.2, t * 3.6);
      v.ring.setPosition(c.x, c.y - t * 0.12).setSize(t * 0.95, t * 0.95);
      v.ring.setStrokeStyle(Math.max(2, t * 0.06), p.glow, 1);
    }
    for (const r of this.rubbish) {
      const cell = r.getData('cell') as { row: number; col: number };
      const c = this.toScreen(cell.col, cell.row);
      r.setPosition(c.x, c.y).setDisplaySize(t * 0.78, t * 0.78);
      r.setAngle(((cell.row * 7 + cell.col * 13) % 5) * 9 - 18);
    }
    for (const c of this.crabs) c.setDisplaySize(t * 0.82, t * 0.82);
    this.hatchling.setDisplaySize(t * 0.7, t * 0.7);
    this.hatchShadow.setSize(t * 0.55, t * 0.18);
    this.nestDots.forEach((d) => d.setDisplaySize(t * 0.34, t * 0.34));
  }

  private syncHatchling(delta: number, time: number): void {
    const h = this.trek.hatchling;
    // Ease towards the cell, or jump when it's far (back to the nest, or a new hatchling).
    const far = Math.abs(h.col - this.drawn.x) + Math.abs(h.row - this.drawn.y) > 1.5;
    const k = this.opts.reducedMotion || far ? 1 : Math.min(1, delta / 70);
    this.drawn.x += (h.col - this.drawn.x) * k;
    this.drawn.y += (h.row - this.drawn.y) * k;
    const c = this.toScreen(this.drawn.x, this.drawn.y);
    const moving = Math.abs(h.col - this.drawn.x) + Math.abs(h.row - this.drawn.y) > 0.02;
    const wobble = moving && !this.opts.reducedMotion ? Math.sin(time / 40) * 8 : 0;
    this.hatchling
      .setPosition(c.x, c.y - this.t * 0.04)
      .setFlipX(this.facing > 0)
      .setAngle(wobble)
      .setVisible(!this.trek.finished || this.trek.ended === 'sunrise');
    this.hatchShadow.setPosition(c.x, c.y + this.t * 0.2).setVisible(this.hatchling.visible);
    // The hatchlings still waiting, huddled in the nest.
    const nest = this.toScreen(NEST_COL, 0);
    const waiting = this.trek.waiting;
    this.nestDots.forEach((d, i) => {
      const a = (i / HATCHLINGS) * Math.PI * 2;
      d.setPosition(
        nest.x + Math.cos(a) * this.t * 0.36,
        nest.y + this.t * 0.1 + Math.sin(a) * this.t * 0.18,
      );
      d.setVisible(i < waiting).setFlipX(i % 2 === 0);
    });
  }

  private syncCrabs(time: number): void {
    this.trek.crabs.forEach((crab, i) => {
      const img = this.crabs[i];
      if (!img) return;
      const c = this.toScreen(crab.x, crab.row);
      const scuttle = this.opts.reducedMotion ? 0 : Math.sin(time / 60 + i) * 6;
      img
        .setPosition(c.x, c.y)
        .setAngle(scuttle)
        .setFlipX(crab.speed > 0);
    });
  }

  private syncLamps(time: number): void {
    const pulling = this.trek.pullingLight();
    for (const v of this.lamps) {
      const on = v.light.on;
      v.glow.setVisible(on);
      v.head.setAlpha(on ? 1 : 0.45);
      if (on) v.head.clearTint();
      else v.head.setTint(this.palette.lampOff);
      // A pulsing ring says "tap me" while a light is pulling the hatchling.
      const pulse = this.opts.reducedMotion ? 1 : 1 + Math.sin(time / 160) * 0.12;
      v.ring.setVisible(on && pulling === v.light).setScale(pulse);
    }
  }

  /** The sea, with a wave that washes up over the wet sand now and then. */
  private drawWater(time: number): void {
    const { t, origin, palette: p } = this;
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.water;
    g.clear();
    const tr = this.trek;
    const shore = origin.y + (ROWS - 1) * t + t * 0.1;
    const up = tr.waveUp ? Math.sin((tr.waveLeft / 1200) * Math.PI) : 0;
    const lap = this.opts.reducedMotion ? 0 : Math.sin(time / 700) * t * 0.08;
    const edge = shore - up * t * 1.05 + lap;
    const pts: Phaser.Math.Vector2[] = [];
    const step = Math.max(8, t * 0.25);
    for (let x = 0; x <= W + step; x += step) {
      const y = edge + Math.sin(x / (t * 0.9) + time / 500) * t * 0.06;
      pts.push(new Phaser.Math.Vector2(x, y));
    }
    pts.push(new Phaser.Math.Vector2(W, H), new Phaser.Math.Vector2(0, H));
    g.fillStyle(p.sea, 1).fillPoints(pts, true);
    g.fillStyle(p.seaDeep, 1).fillRect(0, origin.y + ROWS * t, W, H);
    // Foam along the edge.
    g.lineStyle(Math.max(2, t * 0.07), p.foam, 0.85);
    g.strokePoints(pts.slice(0, -2), false);
  }

  /** Night over the beach, lifting towards sunrise. */
  private drawNight(): void {
    const g = this.night;
    g.clear();
    const tr = this.trek;
    const left = tr.timeLeft / Math.max(1, tr.elapsed + tr.timeLeft);
    const alpha = this.palette.nightAlpha * (0.35 + 0.65 * left);
    g.fillStyle(this.palette.night, alpha);
    g.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  // ---------- Feedback ----------

  private handleEvent(e: TrekEvent): void {
    if (e.kind === 'saved') this.swimAway();
    if (e.kind === 'saved') this.floatText(`+${e.points}`, this.palette.good, ROWS - 1);
    if (e.kind === 'scared') this.floatText('Eek!', this.palette.bad, 0);
    this.hooks.onEvent(e, this.trek);
  }

  private lightOff(light: Light): void {
    this.hooks.onEvent({ kind: 'light-off', light }, this.trek);
    const v = this.lamps.find((l) => l.light === light);
    if (!v || this.opts.reducedMotion) return;
    this.tweens.add({ targets: v.head, scale: v.head.scale * 1.25, duration: 110, yoyo: true });
  }

  /** A saved hatchling paddles off into the sea. */
  private swimAway(): void {
    const c = this.toScreen(this.drawn.x, ROWS - 1);
    const swimmer = this.add
      .image(c.x, c.y, 'img-turtle')
      .setDisplaySize(this.t * 0.7, this.t * 0.7)
      .setDepth(5)
      .setFlipX(this.facing > 0);
    this.tweens.add({
      targets: swimmer,
      y: c.y + this.t * 1.4,
      alpha: 0,
      duration: this.opts.reducedMotion ? 300 : 1400,
      ease: 'Sine.In',
      onComplete: () => swimmer.destroy(),
    });
  }

  private floatText(text: string, color: string, row: number): void {
    const c = this.toScreen(this.drawn.x, row);
    const label = this.add
      .text(c.x, c.y - this.t * 0.4, text, {
        fontFamily: FONT,
        fontStyle: '800',
        fontSize: `${this.font(0.5, 14)}px`,
        color,
        stroke: this.palette.textStroke,
        strokeThickness: Math.max(3, this.t * 0.1),
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.tweens.add({
      targets: label,
      y: c.y - this.t * 1.4,
      alpha: 0,
      duration: 900,
      ease: 'Quad.Out',
      onComplete: () => label.destroy(),
    });
  }
}

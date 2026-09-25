import * as Phaser from 'phaser';
import { RIVER_ITEMS, type RiverItem } from '../../content/river';
import { imageUrl } from '../../ui/images';
import {
  RiverSpawner,
  RiverState,
  flowSpeed,
  maxOnScreen,
  spawnInterval,
  type BumpOutcome,
  type CatchOutcome,
} from './logic';

export interface RiverHooks {
  onChange: (state: RiverState) => void;
  onCatch: (item: RiverItem, outcome: CatchOutcome) => void;
  onBump: (item: RiverItem, outcome: BumpOutcome) => void;
  onEscape: (item: RiverItem) => void;
  onGameOver: (state: RiverState) => void;
}

interface Palette {
  waterTop: number;
  waterBottom: number;
  bank: number;
  bankEdge: number;
  mud: number;
  bush: number;
  bushLight: number;
  flowers: [number, number];
  ripple: number;
  rippleAlpha: number;
  good: string;
  bad: string;
  muted: string;
  textStroke: string;
}

const LIGHT: Palette = {
  waterTop: 0x9ad8f2,
  waterBottom: 0x3ea3da,
  bank: 0xa9d774,
  bankEdge: 0x86c156,
  mud: 0xe6d8a6,
  bush: 0x4f9d3d,
  bushLight: 0x6dbd50,
  flowers: [0xf7c948, 0xf28b82],
  ripple: 0xffffff,
  rippleAlpha: 0.5,
  good: '#1f8a4c',
  bad: '#cf3e2a',
  muted: '#16191d',
  textStroke: '#ffffff',
};

const DARK: Palette = {
  waterTop: 0x1f5773,
  waterBottom: 0x0f3149,
  bank: 0x2f4b2b,
  bankEdge: 0x3c6136,
  mud: 0x4f4833,
  bush: 0x1e3a1e,
  bushLight: 0x2d5a2a,
  flowers: [0xd9a93a, 0xc7685e],
  ripple: 0xcfe9ff,
  rippleAlpha: 0.2,
  good: '#4cc184',
  bad: '#f07f69',
  muted: '#eef1f4',
  textStroke: '#0d1117',
};

const FONT = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif';
const RIPPLES = 14;
const DECOR_PER_BANK = 6;
/** Sizes the decoration textures are drawn at; the images are scaled from these. */
const RIPPLE_UNIT = 12;
const SCENERY_SIZE = 24;
/** Keyboard steering speed, in boat-range widths per second. */
const KEY_SPEED = 1.1;

export interface RiverOptions {
  dark: boolean;
  /** Phone variant: bigger items, a slower river and fewer items at once. */
  compact: boolean;
  /** Skip decorative motion (scrolling banks, ripples, wobble, camera shake). */
  reducedMotion: boolean;
  /** Trip length override for end-to-end tests. */
  tripMs?: number;
}

interface Floating {
  item: RiverItem;
  box: Phaser.GameObjects.Container;
  img: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Ellipse;
  /** Position across the water (0–1) and down the play area (fraction of height). */
  nx: number;
  ny: number;
  /** Sideways drift, in water widths per second. */
  drift: number;
  phase: number;
  done: boolean;
}

interface Scenery {
  img: Phaser.GameObjects.Image;
  /** Down the play area (fraction of height), and which bank. */
  ny: number;
  side: -1 | 1;
  /** Position across the bank (0–1). */
  across: number;
}

/**
 * River Rescue play field: a river flowing down the screen with a canoe at the bottom.
 * Rules live in logic.ts; this scene only handles drawing, input and motion, and
 * reports back to the DOM through `hooks`.
 */
export class RiverScene extends Phaser.Scene {
  private hooks: RiverHooks;
  private palette: Palette;
  private opts: RiverOptions;
  private state: RiverState;
  private spawner = new RiverSpawner(RIVER_ITEMS);
  private floating: Floating[] = [];
  private running = false;
  private sinceSpawn = 0;
  private lastSeconds = -1;
  private time0 = 0;
  private lastTime = 0;
  private bg!: Phaser.GameObjects.Graphics;
  private ripples: { img: Phaser.GameObjects.Image; nx: number; ny: number }[] = [];
  private scenery: Scenery[] = [];
  private boat!: Phaser.GameObjects.Image;
  private wake!: Phaser.GameObjects.Ellipse;
  /** Boat position and steering target across its range (0–1). */
  private boatPos = 0.5;
  private boatTarget = 0.5;
  private boatVel = 0;
  private keys: Phaser.Input.Keyboard.Key[][] = [];

  constructor(hooks: RiverHooks, opts: RiverOptions) {
    super('river');
    this.hooks = hooks;
    this.opts = opts;
    this.palette = opts.dark ? DARK : LIGHT;
    this.state = new RiverState(opts.tripMs);
  }

  // Layout helpers, all derived from the current game size.
  private get W() {
    return this.scale.width;
  }
  private get H() {
    return this.scale.height;
  }
  private get unit() {
    return Math.min(this.W, this.H * 0.85) / 100;
  }
  /** The river stays a comfortable width; wide screens get wider banks instead. */
  private get waterWidth() {
    return Math.min(this.W * (this.opts.compact ? 0.86 : 0.84), this.H * 1.25);
  }
  private get waterLeft() {
    return (this.W - this.waterWidth) / 2;
  }
  private get itemRadius() {
    return this.unit * (this.opts.compact ? 7.5 : 6);
  }
  private get boatWidth() {
    return this.itemRadius * 3.4;
  }
  private get boatY() {
    return this.H * (this.opts.compact ? 0.8 : 0.84);
  }
  /** Radius of the circle in the middle of the canoe that scoops up rubbish. */
  private get scoopRadius() {
    return this.boatWidth * 0.32;
  }
  private get boatMinX() {
    return this.waterLeft + this.boatWidth * 0.42;
  }
  private get boatMaxX() {
    return this.waterLeft + this.waterWidth - this.boatWidth * 0.42;
  }
  private get boatX() {
    return this.boatMinX + this.boatPos * (this.boatMaxX - this.boatMinX);
  }

  preload(): void {
    for (const item of RIVER_ITEMS) this.load.image(`river-${item.id}`, imageUrl(item.image));
    this.load.image('river-canoe', imageUrl('canoe'));
  }

  create(): void {
    this.bakeTextures();
    this.bg = this.add.graphics().setDepth(0);
    this.scenery = Array.from({ length: DECOR_PER_BANK * 2 }, (_, i) => ({
      img: this.add.image(0, 0, `river-scenery-${i % 3}`).setDepth(1),
      ny: (Math.floor(i / 2) + Math.random() * 0.6) / DECOR_PER_BANK,
      side: i % 2 === 0 ? -1 : 1,
      across: 0.3 + Math.random() * 0.4,
    }));
    this.ripples = Array.from({ length: RIPPLES }, (_, i) => ({
      img: this.add.image(0, 0, 'river-ripple').setDepth(2),
      nx: Math.random(),
      ny: i / RIPPLES + Math.random() * 0.05,
    }));
    this.wake = this.add.ellipse(0, 0, 10, 10, this.palette.ripple, 0.35).setDepth(5);
    this.boat = this.add.image(0, 0, 'river-canoe').setDepth(6);
    // The canoe picture comes with its own strip of sea; crop it off so it sits in our river.
    const frame = this.boat.frame;
    this.boat.setCrop(0, 0, frame.width, frame.height * 0.74);
    this.layout();

    this.scale.on('resize', this.layout, this);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      // Mouse steers by hovering; touch only while a finger is down (that's a drag).
      if (p.wasTouch && !p.isDown) return;
      this.steerTo(p.x);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.steerTo(p.x));

    // No key capture, so the arrow keys and letters still work in the rest of the page.
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard;
    if (kb) {
      this.keys = [
        [kb.addKey(K.LEFT, false), kb.addKey(K.A, false)],
        [kb.addKey(K.RIGHT, false), kb.addKey(K.D, false)],
      ];
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
    });
  }

  /** Starts (or restarts) a run. Called from the DOM overlay. */
  startRun(): void {
    for (const f of this.floating) f.box.destroy();
    this.floating = [];
    this.state = new RiverState(this.opts.tripMs);
    this.spawner = new RiverSpawner(RIVER_ITEMS);
    this.sinceSpawn = spawnInterval(0, this.opts.compact) - 400;
    this.lastSeconds = this.state.secondsLeft;
    this.boatPos = this.boatTarget = 0.5;
    this.boatVel = 0;
    this.boat.setAlpha(1).clearTint();
    this.running = true;
    this.hooks.onChange(this.state);
  }

  /** Test hook: floating items, the boat and the score, in game coordinates. */
  debugSnapshot() {
    return {
      items: this.floating
        .filter((f) => !f.done)
        .map((f) => ({ id: f.item.id, kind: f.item.kind, x: f.box.x, y: f.box.y })),
      boat: { x: this.boatX, y: this.boatY },
      radius: this.itemRadius,
      running: this.running,
      score: this.state.score,
      lives: this.state.lives,
    };
  }

  override update(time: number): void {
    // Use the real frame time (capped), so the trip clock keeps pace with the wall clock
    // even when Phaser's smoothed delta is throttled.
    const delta = Math.min(Math.max(time - this.lastTime, 0), 100);
    this.lastTime = time;
    const dt = delta / 1000;
    this.time0 = time;
    const flow = flowSpeed(this.state.elapsed, this.opts.compact);
    if (!this.opts.reducedMotion) this.scrollScenery(flow * dt);
    if (!this.running) {
      this.placeBoat(dt);
      return;
    }

    // Keyboard: hold to paddle.
    const dir =
      (this.keys[1]?.some((k) => k.isDown) ? 1 : 0) - (this.keys[0]?.some((k) => k.isDown) ? 1 : 0);
    if (dir !== 0) {
      this.boatTarget = Phaser.Math.Clamp(this.boatPos + dir * KEY_SPEED * dt, 0, 1);
      this.boatPos = this.boatTarget;
    }
    this.placeBoat(dt);

    for (const f of this.floating) {
      if (f.done) continue;
      f.ny += flow * dt;
      f.nx += f.drift * dt;
      if (f.nx < 0 || f.nx > 1) {
        f.drift = -f.drift;
        f.nx = Phaser.Math.Clamp(f.nx, 0, 1);
      }
      this.placeItem(f);
      if (this.hitsBoat(f)) {
        if (f.item.kind === 'rubbish') this.scoop(f);
        else this.bump(f);
        if (!this.running) return;
      } else if (f.box.y - this.itemRadius > this.H) {
        this.escaped(f);
      }
    }
    this.floating = this.floating.filter((f) => !f.done || f.box.active);

    const ended = this.state.tick(delta);
    if (this.state.secondsLeft !== this.lastSeconds) {
      this.lastSeconds = this.state.secondsLeft;
      this.hooks.onChange(this.state);
    }
    if (ended) {
      this.endRun();
      return;
    }

    this.sinceSpawn += delta;
    const active = this.floating.filter((f) => !f.done).length;
    if (
      active < maxOnScreen(this.state.elapsed, this.opts.compact) &&
      this.sinceSpawn >= spawnInterval(this.state.elapsed, this.opts.compact)
    ) {
      this.spawn();
      this.sinceSpawn = 0;
    }
  }

  private layout(): void {
    const { W, H, unit, palette, waterLeft, waterWidth } = this;
    const g = this.bg;
    g.clear();
    g.fillStyle(palette.bank, 1);
    g.fillRect(0, 0, W, H);
    // A darker strip of grass and a muddy edge along each bank.
    const edge = unit * 1.6;
    g.fillStyle(palette.bankEdge, 1);
    g.fillRect(waterLeft - edge * 2, 0, waterWidth + edge * 4, H);
    g.fillStyle(palette.mud, 1);
    g.fillRect(waterLeft - edge, 0, waterWidth + edge * 2, H);
    g.fillGradientStyle(
      palette.waterTop,
      palette.waterTop,
      palette.waterBottom,
      palette.waterBottom,
      1,
    );
    g.fillRect(waterLeft, 0, waterWidth, H);

    for (const r of this.ripples) r.img.setScale(unit / RIPPLE_UNIT);
    // Scenery is scaled to fit narrow phone banks too.
    const size = Math.min(unit * 2.4, waterLeft * 0.3);
    for (const s of this.scenery) s.img.setScale(size / SCENERY_SIZE).setVisible(size >= 2);
    this.placeScenery();

    const bw = this.boatWidth;
    this.boat.setDisplaySize(bw, bw);
    this.wake.setSize(bw * 0.9, bw * 0.3);
    this.placeBoat(0);
    for (const f of this.floating) {
      if (f.done) continue;
      this.sizeItem(f);
      this.placeItem(f);
    }
  }

  /** Draws the ripples and bank scenery once, as textures. */
  private bakeTextures(): void {
    const { palette } = this;
    const bake = (
      key: string,
      w: number,
      h: number,
      draw: (g: Phaser.GameObjects.Graphics) => void,
    ) => {
      if (this.textures.exists(key)) return;
      const g = this.add.graphics();
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    const u = RIPPLE_UNIT;
    bake('river-ripple', u * 4.2, u * 1.4, (g) => {
      g.lineStyle(u * 0.45, palette.ripple, palette.rippleAlpha);
      g.beginPath();
      g.arc(u * 2.1, -u * 1.9, u * 3, Math.PI * 0.3, Math.PI * 0.7, false);
      g.strokePath();
    });

    // Bushes, reeds and flowers for the banks, drawn around the middle of the texture.
    const S = SCENERY_SIZE;
    const c = S * 2;
    bake('river-scenery-0', S * 4, S * 4, (g) => {
      g.fillStyle(palette.bush, 1);
      g.fillCircle(c - S * 0.7, c + S * 0.2, S * 0.8);
      g.fillCircle(c + S * 0.7, c + S * 0.2, S * 0.8);
      g.fillStyle(palette.bushLight, 1);
      g.fillCircle(c, c - S * 0.2, S);
    });
    bake('river-scenery-1', S * 4, S * 4, (g) => {
      g.lineStyle(S * 0.2, palette.bush, 1);
      for (const dx of [-0.5, 0, 0.5]) g.lineBetween(c + dx * S, c + S, c + dx * S * 1.6, c - S);
      g.fillStyle(palette.flowers[0], 1);
      g.fillCircle(c, c - S * 1.1, S * 0.3);
    });
    bake('river-scenery-2', S * 4, S * 4, (g) => {
      g.fillStyle(palette.bushLight, 1);
      g.fillCircle(c, c, S * 0.7);
      g.fillStyle(palette.flowers[1], 1);
      g.fillCircle(c - S * 0.5, c - S * 0.3, S * 0.3);
      g.fillCircle(c + S * 0.4, c + S * 0.2, S * 0.3);
    });
  }

  private scrollScenery(dy: number): void {
    for (const r of this.ripples) {
      r.ny += dy * 1.1;
      if (r.ny > 1.05) {
        r.ny -= 1.1;
        r.nx = Math.random();
      }
    }
    for (const s of this.scenery) {
      s.ny += dy;
      if (s.ny > 1.08) s.ny -= 1.16;
    }
    this.placeScenery();
  }

  private placeScenery(): void {
    const { W, H, waterLeft, waterWidth } = this;
    const margin = this.unit * 4;
    for (const r of this.ripples) {
      r.img.setPosition(waterLeft + margin + r.nx * (waterWidth - margin * 2), r.ny * H);
    }
    // Scenery sits on the bank, clear of the muddy edge.
    const bankInner = Math.max(0, waterLeft - this.unit * 3.2);
    for (const s of this.scenery) {
      const x = bankInner * (0.15 + s.across * 0.7);
      s.img.setPosition(s.side < 0 ? x : W - x, s.ny * H);
    }
  }

  private placeBoat(dt: number): void {
    // Ease towards the target; exponential smoothing keeps it frame-rate independent.
    const before = this.boatPos;
    this.boatPos += (this.boatTarget - this.boatPos) * (1 - Math.exp(-dt * 12));
    if (dt > 0) this.boatVel = (this.boatPos - before) / dt;
    const bob = this.opts.reducedMotion ? 0 : Math.sin(this.time0 / 400) * this.unit * 0.4;
    const tilt = this.opts.reducedMotion ? 0 : Phaser.Math.Clamp(this.boatVel * 0.12, -0.2, 0.2);
    this.boat.setPosition(this.boatX, this.boatY + bob).setRotation(tilt);
    this.wake.setPosition(this.boatX, this.boatY + this.boatWidth * 0.14);
  }

  private steerTo(x: number): void {
    if (!this.running) return;
    const range = this.boatMaxX - this.boatMinX;
    this.boatTarget = Phaser.Math.Clamp((x - this.boatMinX) / range, 0, 1);
  }

  private spawn(): void {
    const { item, x } = this.spawner.next(this.state.elapsed);
    const { ripple, rippleAlpha } = this.palette;
    const ring = this.add.ellipse(0, 0, 10, 10, ripple, rippleAlpha * 0.7);
    const img = this.add.image(0, 0, `river-${item.id}`);
    const box = this.add.container(0, 0, [ring, img]).setDepth(4);
    const animal = item.kind === 'animal';
    const f: Floating = {
      item,
      box,
      img,
      ring,
      nx: x,
      ny: -this.itemRadius / this.H,
      // Animals swim about a little more than rubbish drifts.
      drift: (Math.random() - 0.5) * (animal ? 0.12 : 0.05),
      phase: Math.random() * Math.PI * 2,
      done: false,
    };
    this.sizeItem(f);
    f.ny = -(f.img.displayHeight / 2 + this.unit) / this.H;
    this.placeItem(f);
    this.floating.push(f);
  }

  private sizeItem(f: Floating): void {
    const r = this.itemRadius * (f.item.kind === 'animal' ? 1.1 : 1);
    f.img.setDisplaySize(r * 2, r * 2);
    f.ring.setSize(r * 2.1, r * 0.8).setPosition(0, r * 0.55);
  }

  private placeItem(f: Floating): void {
    const r = this.itemRadius;
    const x = this.waterLeft + r + f.nx * (this.waterWidth - r * 2);
    f.box.setPosition(x, f.ny * this.H);
    if (!this.opts.reducedMotion) {
      f.img.setRotation(Math.sin(this.time0 / 500 + f.phase) * 0.12);
    }
  }

  private hitsBoat(f: Floating): boolean {
    const reach = this.scoopRadius + this.itemRadius * 0.75;
    const dx = f.box.x - this.boatX;
    const dy = f.box.y - this.boatY;
    return dx * dx + dy * dy < reach * reach;
  }

  private scoop(f: Floating): void {
    f.done = true;
    const outcome = this.state.catchRubbish();
    this.hooks.onCatch(f.item, outcome);
    this.hooks.onChange(this.state);
    this.floatText(f.box.x, f.box.y - this.itemRadius, `+${outcome.points}`, this.palette.good);
    this.tweens.add({
      targets: f.box,
      x: this.boatX,
      y: this.boatY,
      scale: 0.2,
      alpha: 0,
      duration: 220,
      ease: 'Quad.In',
      onComplete: () => f.box.destroy(),
    });
  }

  private bump(f: Floating): void {
    f.done = true;
    const outcome = this.state.bumpAnimal(f.item);
    this.hooks.onBump(f.item, outcome);
    this.hooks.onChange(this.state);
    this.floatText(f.box.x, f.box.y - this.itemRadius, 'Oops!', this.palette.bad);
    this.splash(f.box.x, f.box.y);
    if (!this.opts.reducedMotion) this.cameras.main.shake(180, 0.006);
    this.boat.setTint(0xff9a8a);
    this.time.delayedCall(260, () => this.boat.clearTint());
    // The animal darts away from the boat.
    const away = f.box.x < this.boatX ? -1 : 1;
    this.tweens.add({
      targets: f.box,
      x: f.box.x + away * this.itemRadius * 3,
      y: f.box.y - this.itemRadius * 2.5,
      alpha: 0,
      scale: 0.7,
      duration: 480,
      ease: 'Quad.Out',
      onComplete: () => f.box.destroy(),
    });
    if (outcome.gameOver) this.endRun();
  }

  private escaped(f: Floating): void {
    f.done = true;
    f.box.destroy();
    if (f.item.kind !== 'rubbish') return;
    this.state.escape(f.item);
    this.hooks.onEscape(f.item);
    this.hooks.onChange(this.state);
    this.floatText(
      Phaser.Math.Clamp(f.box.x, this.unit * 12, this.W - this.unit * 12),
      this.H - this.unit * 5,
      'To the sea!',
      this.palette.muted,
      0.7,
    );
  }

  private splash(x: number, y: number): void {
    const ring = this.add
      .circle(x, y, this.itemRadius, 0x000000, 0)
      .setStrokeStyle(this.unit * 0.6, this.palette.ripple, 0.9)
      .setDepth(3);
    this.tweens.add({
      targets: ring,
      scale: 2.2,
      alpha: 0,
      duration: 450,
      ease: 'Quad.Out',
      onComplete: () => ring.destroy(),
    });
  }

  private floatText(x: number, y: number, text: string, color: string, size = 1): void {
    const t = this.add
      .text(x, y, text, {
        fontFamily: FONT,
        fontStyle: '800',
        fontSize: `${Math.round(this.unit * 5 * size)}px`,
        color,
        stroke: this.palette.textStroke,
        strokeThickness: this.unit * 0.8,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: t,
      y: y - this.unit * 8,
      alpha: 0,
      duration: 700,
      ease: 'Quad.Out',
      onComplete: () => t.destroy(),
    });
  }

  private endRun(): void {
    this.running = false;
    for (const f of this.floating) {
      if (f.done) continue;
      f.done = true;
      this.tweens.add({
        targets: f.box,
        alpha: 0,
        duration: 300,
        onComplete: () => f.box.destroy(),
      });
    }
    this.time.delayedCall(900, () => this.hooks.onGameOver(this.state));
  }
}

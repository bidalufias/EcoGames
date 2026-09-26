import * as Phaser from 'phaser';
import { APPLIANCES, FAMILY, PLAYER, ROOMS, type RoomId } from '../../content/energy';
import { seededRng } from '../../core/random';
import { imageUrl } from '../../ui/images';
import { DARK_HOUSE, HouseArt, LIGHT_HOUSE, type HousePalette } from './HouseArt';
import {
  HouseDay,
  type Dir,
  type DayEvent,
  type Level,
  type PressOutcome,
  type Tile,
  type Walker,
} from './logic';
import { FRAME_H, FRAME_W, LOOKS, drawSheet, frameName, sheetFrames, type Facing } from './sprites';

export interface SwitchHooks {
  onChange: (day: HouseDay) => void;
  onEvent: (event: DayEvent, day: HouseDay) => void;
  onGameOver: (day: HouseDay) => void;
}

interface Palette {
  house: HousePalette;
  shade: number;
  shadeAlpha: number;
  glow: number;
  waste: number;
  player: number;
  /** Room names written on the floor. */
  label: string;
  good: string;
  bad: string;
  bubble: string;
  bubbleInk: string;
  textStroke: string;
}

const LIGHT: Palette = {
  house: LIGHT_HOUSE,
  shade: 0x0b1530,
  shadeAlpha: 0.12,
  glow: 0xffd24a,
  waste: 0xe0573f,
  player: 0x0079c2,
  label: '#8a7458',
  good: '#1f8a4c',
  bad: '#cf3e2a',
  bubble: '#ffffff',
  bubbleInk: '#16191d',
  textStroke: '#ffffff',
};

const DARK: Palette = {
  house: DARK_HOUSE,
  shade: 0x000000,
  shadeAlpha: 0.28,
  glow: 0xf2bf4f,
  waste: 0xf07f69,
  player: 0x4aa8ea,
  label: '#b3a48f',
  good: '#4cc184',
  bad: '#f07f69',
  bubble: '#f3f1e8',
  bubbleInk: '#16191d',
  textStroke: '#0d1117',
};

/** Sprite sheets are drawn at this many pixels per sprite unit (see sprites.ts). */
const SPRITE_PIXELS = 5;
/** Appliance pictures, in tiles. */
const ICON = 0.9;
/** Where feet stand, below the middle of a tile, in tiles. */
const FEET = 0.3;

/** Screen directions for plan directions when the plan is on its side (x and y swap). */
const SWAP: Record<Dir, Dir> = { up: 'left', down: 'right', left: 'up', right: 'down' };

const FONT = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif';

export interface SwitchOptions {
  dark: boolean;
  /** Phone variant: bigger tap areas around appliances. */
  compact: boolean;
  reducedMotion: boolean;
  /** Game pixels per CSS pixel, so text stays readable on sharp screens. */
  pixelRatio: number;
  /** Day length override for end-to-end tests. */
  dayMs?: number;
}

interface ApplianceView {
  id: string;
  room: RoomId;
  glow: Phaser.GameObjects.Ellipse;
  ring: Phaser.GameObjects.Ellipse;
  reach: Phaser.GameObjects.Ellipse;
  img: Phaser.GameObjects.Image;
  state: string;
}

interface WalkerView {
  walker: Walker;
  box: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  /** Height compared with a grown-up. */
  scale: number;
  shadow: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
  marker?: Phaser.GameObjects.Ellipse;
  frame: string;
  phase: number;
}

/**
 * Switch Off! play field: the house from above, with the family and the player
 * walking around it. Rules live in logic.ts; this scene draws, handles pointer input
 * and reports back to the DOM through `hooks`.
 */
export class SwitchScene extends Phaser.Scene {
  private hooks: SwitchHooks;
  private palette: Palette;
  private opts: SwitchOptions;
  day: HouseDay;
  private running = false;
  private lastTime = 0;
  /** Keyboard directions held down, set by the DOM (in screen terms). */
  heldDir: Dir | null = null;
  private floor!: Phaser.GameObjects.Graphics;
  private shade!: Phaser.GameObjects.Graphics;
  private walls!: Phaser.GameObjects.Graphics;
  private art!: HouseArt;
  private labels: {
    room: RoomId;
    name: Phaser.GameObjects.Text;
    malay: Phaser.GameObjects.Text;
  }[] = [];
  private appliances: ApplianceView[] = [];
  private walkers: WalkerView[] = [];
  private shadedRooms = '';

  constructor(hooks: SwitchHooks, opts: SwitchOptions) {
    super('switch-off');
    this.hooks = hooks;
    this.palette = opts.dark ? DARK : LIGHT;
    this.opts = opts;
    this.day = new HouseDay('easy', seededRng(1), { dayMs: opts.dayMs });
  }

  // ---------- Layout: the plan is drawn landscape, or turned on its side for tall screens ----------

  private get portrait(): boolean {
    return this.scale.height > this.scale.width * 1.05;
  }
  private get cols(): number {
    return this.portrait ? this.day.plan.height : this.day.plan.width;
  }
  private get rows(): number {
    return this.portrait ? this.day.plan.width : this.day.plan.height;
  }
  /** Tile size in game pixels. */
  private get t(): number {
    return Math.floor(Math.min(this.scale.width / this.cols, this.scale.height / this.rows));
  }
  private get origin(): { x: number; y: number } {
    return {
      x: (this.scale.width - this.t * this.cols) / 2,
      y: (this.scale.height - this.t * this.rows) / 2,
    };
  }
  /** Plan coordinates (tile units, may be fractional) to the centre of that spot on screen. */
  private toScreen(x: number, y: number): { x: number; y: number } {
    const { t, origin } = this;
    const [sx, sy] = this.portrait ? [y, x] : [x, y];
    return { x: origin.x + (sx + 0.5) * t, y: origin.y + (sy + 0.5) * t };
  }
  /** Screen point to plan coordinates (tile units). */
  private toPlan(px: number, py: number): { x: number; y: number } {
    const { t, origin } = this;
    const sx = (px - origin.x) / t - 0.5;
    const sy = (py - origin.y) / t - 0.5;
    return this.portrait ? { x: sy, y: sx } : { x: sx, y: sy };
  }
  /** Screen arrow keys to plan directions (the plan is turned on tall screens). */
  private planDir(dir: Dir): Dir {
    if (!this.portrait) return dir;
    return ({ up: 'left', down: 'right', left: 'up', right: 'down' } as const)[dir];
  }
  /** Font size in game pixels, never below `minCss` CSS pixels. */
  private font(tiles: number, minCss: number): number {
    return Math.round(Math.max(this.t * tiles, minCss * this.opts.pixelRatio));
  }

  preload(): void {
    for (const name of new Set(APPLIANCES.map((a) => a.image))) {
      this.load.image(`img-${name}`, imageUrl(name));
    }
  }

  /** Draws each character's walking sprite sheet into a texture. */
  private makeSprites(): void {
    for (const member of [...FAMILY, PLAYER]) {
      const key = `walker-${member.name}`;
      if (this.textures.exists(key)) continue;
      const look = LOOKS[member.name] ?? LOOKS.You!;
      const texture = this.textures.addCanvas(key, drawSheet(look, SPRITE_PIXELS));
      for (const f of sheetFrames(SPRITE_PIXELS)) texture?.add(f.name, 0, f.x, f.y, f.w, f.h);
    }
  }

  create(): void {
    const p = this.palette;
    this.makeSprites();
    this.floor = this.add.graphics().setDepth(0);
    this.shade = this.add.graphics().setDepth(1);
    this.walls = this.add.graphics().setDepth(2);
    this.art = new HouseArt(this.floor, this.walls, this.day.plan, p.house, this.planView());
    for (const room of ROOMS) {
      const style = { fontFamily: FONT, color: p.label };
      this.labels.push({
        room: room.id,
        name: this.add
          .text(0, 0, room.name.toUpperCase(), { ...style, fontStyle: '800' })
          .setOrigin(0.5, 1)
          .setDepth(3),
        malay: this.add
          .text(0, 0, room.malay, { ...style, fontStyle: 'italic 600' })
          .setOrigin(0.5, 0)
          .setDepth(3),
      });
    }
    for (const a of APPLIANCES) {
      const glow = this.add.ellipse(0, 0, 10, 10, p.glow, 0.5).setDepth(4);
      const ring = this.add.ellipse(0, 0, 10, 10).setStrokeStyle(3, p.waste, 1).setDepth(4);
      const reach = this.add.ellipse(0, 0, 10, 10).setStrokeStyle(3, p.player, 1).setDepth(4);
      const img = this.add.image(0, 0, `img-${a.image}`).setDepth(4);
      this.appliances.push({ id: a.id, room: a.room, glow, ring, reach, img, state: '' });
      if (!this.opts.reducedMotion) {
        this.tweens.add({
          targets: ring,
          scale: { from: 1, to: 1.18 },
          alpha: { from: 1, to: 0.35 },
          duration: 650,
          yoyo: true,
          repeat: -1,
        });
      }
    }
    this.buildWalkers();
    this.layout();

    this.scale.on('resize', this.layout, this);
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => this.onTap(ptr.x, ptr.y));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
    });
  }

  /** Starts (or restarts) a day. Called from the DOM. */
  startDay(level: Level, seed: number): void {
    this.day = new HouseDay(level, seededRng(seed), { dayMs: this.opts.dayMs });
    this.running = true;
    this.buildWalkers();
    this.layout();
    this.hooks.onChange(this.day);
  }

  stop(): void {
    this.running = false;
  }

  /** Keyboard: switch off whatever is on within reach. */
  interact(): void {
    if (!this.running) return;
    this.handlePress(this.day.interact());
  }

  /** Test hook: appliances and walkers in page-independent game coordinates. */
  debugSnapshot() {
    const d = this.day;
    return {
      appliances: APPLIANCES.map((a) => {
        const at = d.plan.applianceTiles[a.id]!;
        return { id: a.id, on: d.isOn(a.id), wasted: d.isWasted(a), ...this.toScreen(at.x, at.y) };
      }),
      player: this.toScreen(d.player.x, d.player.y),
      score: d.score,
    };
  }

  override update(time: number): void {
    // Real frame time (capped), so the day's clock keeps pace with the wall clock.
    const delta = Math.min(Math.max(time - this.lastTime, 0), 100);
    this.lastTime = time;
    if (this.running) {
      if (this.heldDir && !this.day.player.moving) this.day.step(this.planDir(this.heldDir));
      const events = this.day.tick(delta);
      for (const e of events) this.handleEvent(e);
      this.hooks.onChange(this.day);
      if (this.day.finished) {
        this.running = false;
        this.time.delayedCall(700, () => this.hooks.onGameOver(this.day));
      }
    }
    this.syncWalkers(time);
    this.syncAppliances();
    this.syncShade();
  }

  // ---------- Drawing ----------

  private planView() {
    return {
      point: (x: number, y: number) => this.toScreen(x, y),
      t: this.t,
      portrait: this.portrait,
    };
  }

  private buildWalkers(): void {
    for (const w of this.walkers) w.box.destroy();
    const p = this.palette;
    const all: Walker[] = [...this.day.people, this.day.player];
    this.walkers = all.map((walker, i) => {
      const isPlayer = walker === this.day.player;
      const shadow = this.add.ellipse(0, 0, 10, 4, 0x000000, 0.2);
      const marker = isPlayer ? this.add.ellipse(0, 0, 10, 5, p.player, 0.3) : undefined;
      if (marker) marker.setStrokeStyle(2, p.player, 1);
      const frame = frameName('down', 0);
      const sprite = this.add.image(0, 0, `walker-${walker.name}`, frame).setOrigin(0.5, 1);
      const label = this.add
        .text(0, 0, walker.name, {
          fontFamily: FONT,
          fontStyle: '800',
          color: isPlayer ? '#ffffff' : p.bubbleInk,
          backgroundColor: isPlayer ? `#${p.player.toString(16).padStart(6, '0')}` : p.bubble,
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5, 0);
      const parts = [shadow, ...(marker ? [marker] : []), sprite, label];
      const box = this.add.container(0, 0, parts);
      const scale = (LOOKS[walker.name] ?? LOOKS.You!).scale;
      return { walker, box, sprite, scale, shadow, label, marker, frame, phase: i * 170 };
    });
  }

  /** A room's floor on screen, out to the middle of its walls. */
  private roomRect(room: RoomId): Phaser.Geom.Rectangle {
    const b = this.art.areaBox(room);
    const a = this.toScreen(b.x0, b.y0);
    const c = this.toScreen(b.x1, b.y1);
    return new Phaser.Geom.Rectangle(
      Math.min(a.x, c.x),
      Math.min(a.y, c.y),
      Math.abs(c.x - a.x),
      Math.abs(c.y - a.y),
    );
  }

  private layout(): void {
    const { t, palette: p, day } = this;
    const plan = day.plan;
    this.art = new HouseArt(this.floor, this.walls, plan, p.house, this.planView());
    this.art.draw();

    // Room names written on the floor, like an architect's plan, with the Malay name
    // underneath when there is room.
    const size = this.font(0.3, 9);
    const showMalay = t >= 40 * this.opts.pixelRatio;
    for (const l of this.labels) {
      const room = ROOMS.find((r) => r.id === l.room)!;
      const at = plan.layout.labels[l.room];
      const c = this.toScreen(at.x, at.y);
      const width = this.roomRect(l.room).width;
      l.name
        .setFontSize(size)
        .setLetterSpacing(Math.round(size * 0.12))
        .setText(room.name.toUpperCase());
      if (l.name.width > width * 0.9) l.name.setText(room.shortName.toUpperCase());
      l.name.setPosition(c.x, showMalay ? c.y : c.y + size / 2);
      l.malay
        .setFontSize(Math.round(size * 0.8))
        .setPosition(c.x, c.y + size * 0.1)
        .setVisible(showMalay);
    }
    for (const v of this.appliances) {
      const at = plan.applianceTiles[v.id]!;
      const c = this.toScreen(at.x, at.y);
      v.img.setPosition(c.x, c.y).setDisplaySize(t * ICON, t * ICON);
      v.glow.setPosition(c.x, c.y).setSize(t * 1.25, t * 1.25);
      v.ring.setPosition(c.x, c.y).setSize(t * 1.15, t * 1.15);
      v.ring.setStrokeStyle(Math.max(2, t * 0.08), p.waste, 1);
      v.reach.setPosition(c.x, c.y).setSize(t * 1.35, t * 1.35);
      v.reach.setStrokeStyle(Math.max(2, t * 0.07), p.player, 1);
      v.state = '';
    }
    for (const w of this.walkers) {
      const isPlayer = w.walker === day.player;
      const h = t * 1.5 * w.scale;
      w.sprite.setDisplaySize((h * FRAME_W) / FRAME_H, h).setPosition(0, t * FEET);
      w.shadow.setSize(t * 0.62 * w.scale, t * 0.22).setPosition(0, t * FEET);
      w.marker?.setSize(t * 0.95, t * 0.36).setPosition(0, t * FEET);
      // Names only when there is room for them; the player always gets a "You" tag.
      const showName = isPlayer || t >= 30 * this.opts.pixelRatio;
      w.label
        .setVisible(showName)
        .setFontSize(this.font(0.27, 9))
        .setPosition(0, t * (FEET + 0.08));
    }
    this.shadedRooms = '';
  }

  private syncWalkers(time: number): void {
    for (const w of this.walkers) {
      const c = this.toScreen(w.walker.x, w.walker.y);
      w.box.setPosition(c.x, c.y);
      w.box.setDepth(10 + c.y / 10000);
      // Walk cycle: stand, left foot, stand, right foot; quicker for quicker walkers.
      const dir = this.portrait ? SWAP[w.walker.dir] : w.walker.dir;
      const facing: Facing = dir === 'left' || dir === 'right' ? 'side' : dir;
      const frameMs = 400 / w.walker.speed;
      const walking = w.walker.moving && !this.opts.reducedMotion;
      const step = walking ? ([1, 0, 2, 0][Math.floor((time + w.phase) / frameMs) % 4] ?? 0) : 0;
      const frame = frameName(facing, step);
      if (frame !== w.frame) {
        w.frame = frame;
        w.sprite.setFrame(frame, false, false);
      }
      w.sprite.setFlipX(dir === 'left');
    }
  }

  private syncAppliances(): void {
    const d = this.day;
    const reachable = this.running ? d.reachable() : undefined;
    for (const v of this.appliances) {
      const a = d.appliance(v.id)!;
      const on = d.isOn(v.id);
      const wasted = on && d.isWasted(a);
      const state = `${on}${wasted}${reachable?.id === v.id}`;
      if (state === v.state) continue;
      v.state = state;
      v.img.setAlpha(on ? 1 : 0.55);
      if (on) v.img.clearTint();
      else v.img.setTint(0xa8b0b8);
      v.glow.setVisible(on);
      v.ring.setVisible(wasted);
      v.reach.setVisible(reachable?.id === v.id);
    }
  }

  /** Rooms with their light off look a little darker. */
  private syncShade(): void {
    const d = this.day;
    const dark = ROOMS.filter((r) => !d.isOn(`${r.id}-light`)).map((r) => r.id);
    const key = dark.join();
    if (key === this.shadedRooms) return;
    this.shadedRooms = key;
    const g = this.shade;
    g.clear();
    g.fillStyle(this.palette.shade, this.palette.shadeAlpha);
    for (const room of dark) {
      const r = this.roomRect(room);
      g.fillRect(r.x, r.y, r.width, r.height);
    }
  }

  // ---------- Input and feedback ----------

  private onTap(px: number, py: number): void {
    if (!this.running) return;
    const d = this.day;
    const at = this.toPlan(px, py);
    // Tapping on or near an appliance goes and switches it off; phones get a bigger area.
    const reach = this.opts.compact ? 1.1 : 0.8;
    let best: { id: string; dist: number } | null = null;
    for (const a of APPLIANCES) {
      const tile = d.plan.applianceTiles[a.id]!;
      const dist = Math.hypot(tile.x - at.x, tile.y - at.y);
      if (dist <= reach && (!best || dist < best.dist)) best = { id: a.id, dist };
    }
    if (best) {
      const outcome = d.goSwitch(best.id);
      if (outcome) this.handlePress(outcome);
      else this.tapMarker(px, py);
      return;
    }
    const tile: Tile = { x: Math.round(at.x), y: Math.round(at.y) };
    d.walkTo(tile);
    this.tapMarker(px, py);
  }

  private tapMarker(x: number, y: number): void {
    const m = this.add
      .ellipse(x, y, this.t * 0.6, this.t * 0.6)
      .setStrokeStyle(Math.max(2, this.t * 0.06), this.palette.player, 0.9)
      .setDepth(5);
    this.tweens.add({
      targets: m,
      scale: 1.6,
      alpha: 0,
      duration: this.opts.reducedMotion ? 200 : 450,
      onComplete: () => m.destroy(),
    });
  }

  private handleEvent(e: DayEvent): void {
    if (e.kind === 'press') {
      this.handlePress(e.outcome);
      return;
    }
    if (e.kind === 'on') this.pop(e.appliance.id);
    this.hooks.onEvent(e, this.day);
  }

  private handlePress(outcome: PressOutcome): void {
    const d = this.day;
    if (outcome.kind === 'off') {
      this.floatText(outcome.appliance.id, `+${outcome.points}`, this.palette.good);
    } else if (outcome.kind === 'oops' || outcome.kind === 'busy') {
      this.bubble(outcome.by, 'I’m using that!');
      if (outcome.kind === 'oops' && outcome.penalty > 0) {
        this.floatText(outcome.appliance.id, `−${outcome.penalty}`, this.palette.bad);
      }
    }
    this.hooks.onEvent({ kind: 'press', outcome }, d);
    this.hooks.onChange(d);
  }

  /** A little bounce when someone switches something on. */
  private pop(id: string): void {
    const v = this.appliances.find((a) => a.id === id);
    if (!v || this.opts.reducedMotion) return;
    const size = this.t * ICON;
    this.tweens.add({
      targets: v.img,
      displayWidth: size * 1.25,
      displayHeight: size * 1.25,
      duration: 120,
      yoyo: true,
    });
  }

  private floatText(id: string, text: string, color: string): void {
    const at = this.day.plan.applianceTiles[id];
    if (!at) return;
    const c = this.toScreen(at.x, at.y);
    const label = this.add
      .text(c.x, c.y - this.t * 0.5, text, {
        fontFamily: FONT,
        fontStyle: '800',
        fontSize: `${this.font(0.5, 14)}px`,
        color,
        stroke: this.palette.textStroke,
        strokeThickness: Math.max(3, this.t * 0.1),
      })
      .setOrigin(0.5)
      .setDepth(30);
    this.tweens.add({
      targets: label,
      y: c.y - this.t * 1.6,
      alpha: 0,
      duration: 800,
      ease: 'Quad.Out',
      onComplete: () => label.destroy(),
    });
  }

  /** A speech bubble above a family member. */
  private bubble(who: Walker, text: string): void {
    const view = this.walkers.find((w) => w.walker === who);
    if (!view) return;
    const b = this.add
      .text(0, -this.t * 0.8, text, {
        fontFamily: FONT,
        fontStyle: '800',
        fontSize: `${this.font(0.32, 11)}px`,
        color: this.palette.bubbleInk,
        backgroundColor: this.palette.bubble,
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1);
    view.box.add(b);
    this.tweens.add({
      targets: b,
      alpha: 0,
      delay: 900,
      duration: 300,
      onComplete: () => b.destroy(),
    });
  }
}

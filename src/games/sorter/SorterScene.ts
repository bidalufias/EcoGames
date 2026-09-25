import * as Phaser from 'phaser';
import { BINS, WASTE_ITEMS, type Bin, type BinId, type WasteItem } from '../../content/waste';
import { iconDataUrl } from '../../ui/icons';
import {
  ItemBag,
  SorterState,
  fallSpeed,
  maxOnScreen,
  spawnInterval,
  type SortOutcome,
} from './logic';

export interface SorterHooks {
  onChange: (state: SorterState) => void;
  onSort: (item: WasteItem, bin: Bin, outcome: SortOutcome) => void;
  onMiss: (item: WasteItem, outcome: SortOutcome) => void;
  onGameOver: (state: SorterState) => void;
}

interface Palette {
  skyTop: number;
  skyBottom: number;
  ground: number;
  cloud: number;
  token: number;
  tokenStroke: number;
  ink: string;
  labelBg: string;
}

const LIGHT: Palette = {
  skyTop: 0xdcedf9,
  skyBottom: 0xffffff,
  ground: 0xeaeef2,
  cloud: 0xffffff,
  token: 0xffffff,
  tokenStroke: 0x16191d,
  ink: '#16191d',
  labelBg: '#ffffffee',
};

const DARK: Palette = {
  skyTop: 0x0c1f2c,
  skyBottom: 0x0d1714,
  ground: 0x1c2c27,
  cloud: 0x1d3340,
  token: 0xf3f1e8,
  tokenStroke: 0x000000,
  ink: '#16191d',
  labelBg: '#f3f1e8ee',
};

const FONT = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif';

export interface SorterOptions {
  dark: boolean;
  /** Phone variant: fewer items on screen at once. */
  compact: boolean;
}

interface Falling {
  item: WasteItem;
  box: Phaser.GameObjects.Container;
  dragging: boolean;
  done: boolean;
}

interface BinView {
  bin: Bin;
  box: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Graphics;
  zone: Phaser.GameObjects.Zone;
  label: Phaser.GameObjects.Text;
  badge: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Image;
}

/**
 * Waste Sorter play field. Rules live in logic.ts; this scene only handles
 * drawing, input and motion, and reports back to the DOM through `hooks`.
 */
export class SorterScene extends Phaser.Scene {
  private hooks: SorterHooks;
  private palette: Palette;
  private state = new SorterState();
  private bag = new ItemBag(WASTE_ITEMS);
  private falling: Falling[] = [];
  private bins: BinView[] = [];
  private running = false;
  private sinceSpawn = 0;
  private lastSpawnX = -1;
  private bg!: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Ellipse[] = [];

  private compact: boolean;

  constructor(hooks: SorterHooks, opts: SorterOptions) {
    super('sorter');
    this.hooks = hooks;
    this.palette = opts.dark ? DARK : LIGHT;
    this.compact = opts.compact;
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
  private get binHeight() {
    return Phaser.Math.Clamp(this.H * 0.24, this.unit * 20, this.unit * 30);
  }
  private get binTop() {
    return this.H - this.binHeight - this.unit * 3;
  }
  private get tokenRadius() {
    return this.unit * 7.5;
  }

  preload(): void {
    for (const item of WASTE_ITEMS) {
      this.load.svg(
        `item-${item.id}`,
        iconDataUrl(item.icon, { size: 128, color: this.palette.ink, strokeWidth: 1.75 }),
      );
    }
    for (const bin of BINS) {
      this.load.svg(
        `bin-${bin.id}`,
        iconDataUrl(bin.icon, { size: 128, color: '#ffffff', strokeWidth: 2 }),
      );
    }
  }

  create(): void {
    this.bg = this.add.graphics();
    this.clouds = Array.from({ length: 3 }, () =>
      this.add.ellipse(0, 0, 10, 10, this.palette.cloud, 0.7),
    );
    this.bins = BINS.map((bin) => this.createBin(bin));
    this.layout();

    this.scale.on('resize', this.layout, this);
    this.input.on(
      'drag',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container, x: number, y: number) => {
        obj.setPosition(
          Phaser.Math.Clamp(x, this.tokenRadius, this.W - this.tokenRadius),
          Phaser.Math.Clamp(y, this.tokenRadius, this.H - this.tokenRadius),
        );
        this.highlightBin(y > this.binTop - this.tokenRadius ? this.binAt(x) : null);
      },
    );
    this.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      const f = this.findFalling(obj);
      if (!f) return;
      f.dragging = true;
      obj.setDepth(10);
      this.tweens.add({ targets: obj, scale: 1.12, duration: 120 });
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
      const f = this.findFalling(obj);
      this.highlightBin(null);
      if (!f || f.done) return;
      f.dragging = false;
      this.tweens.add({ targets: obj, scale: 1, duration: 120 });
      if (obj.y > this.binTop - this.tokenRadius) {
        const target = this.binAt(obj.x);
        if (target) this.resolve(f, target);
      }
    });

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const bin = this.bins.find((b) => b.bin.key === e.key);
      if (bin) this.sendLowestTo(bin);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
    });
  }

  /** Starts (or restarts) a run. Called from the DOM overlay. */
  startRun(): void {
    for (const f of this.falling) f.box.destroy();
    this.falling = [];
    this.state = new SorterState();
    this.bag = new ItemBag(WASTE_ITEMS);
    this.sinceSpawn = Number.POSITIVE_INFINITY;
    this.running = true;
    this.hooks.onChange(this.state);
  }

  /** Test hook: falling items and bins in game coordinates. */
  debugSnapshot() {
    return {
      items: this.falling
        .filter((f) => !f.done)
        .map((f) => ({ id: f.item.id, bin: f.item.bin, x: f.box.x, y: f.box.y })),
      bins: this.bins.map((b) => ({ id: b.bin.id, x: b.box.x, y: b.box.y })),
      radius: this.tokenRadius,
      score: this.state.score,
    };
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    this.clouds.forEach((c, i) => {
      c.x += (6 + i * 4) * this.unit * 0.1 * dt * 10;
      if (c.x - c.width / 2 > this.W) c.x = -c.width / 2;
    });
    if (!this.running) return;

    const speed = fallSpeed(this.state.sorted) * this.H;
    for (const f of this.falling) {
      if (f.dragging || f.done) continue;
      f.box.y += speed * dt;
      if (f.box.y + this.tokenRadius >= this.binTop) this.missed(f);
    }
    this.falling = this.falling.filter((f) => !f.done);

    this.sinceSpawn += delta;
    if (
      this.falling.length < maxOnScreen(this.state.sorted, this.compact ? 2 : 3) &&
      this.sinceSpawn >= spawnInterval(this.state.sorted)
    ) {
      this.spawn();
      this.sinceSpawn = 0;
    }
  }

  private createBin(bin: Bin): BinView {
    const body = this.add.graphics();
    const icon = this.add.image(0, 0, `bin-${bin.id}`);
    const label = this.add
      .text(0, 0, bin.label, {
        fontFamily: FONT,
        fontStyle: '700',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5, 0);
    const badge = this.add
      .text(0, 0, bin.key, { fontFamily: FONT, fontStyle: '700', color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0.85);
    const box = this.add.container(0, 0, [body, icon, label, badge]);
    const zone = this.add.zone(0, 0, 10, 10).setInteractive({ useHandCursor: true });
    const view: BinView = { bin, box, body, zone, label, badge, icon };
    zone.on('pointerdown', () => this.sendLowestTo(view));
    return view;
  }

  private layout(): void {
    const { W, H, unit, palette } = this;
    this.bg.clear();
    this.bg.fillGradientStyle(
      palette.skyTop,
      palette.skyTop,
      palette.skyBottom,
      palette.skyBottom,
      1,
    );
    this.bg.fillRect(0, 0, W, H);
    this.bg.fillStyle(palette.ground, 1);
    this.bg.fillRect(0, this.binTop + this.binHeight * 0.55, W, H);

    this.clouds.forEach((c, i) => {
      c.setSize(unit * (22 + i * 6), unit * (8 + i * 2));
      c.setPosition(((i * 0.37 + 0.15) % 1) * W, H * (0.08 + i * 0.1));
    });

    const gap = unit * 2.5;
    const bw = (W - gap * (BINS.length + 1)) / BINS.length;
    const bh = this.binHeight;
    const radius = Math.min(unit * 3, bw * 0.15);
    this.bins.forEach((b, i) => {
      const x = gap + i * (bw + gap);
      b.box.setPosition(x + bw / 2, this.binTop + bh / 2);
      this.drawBin(b, bw, bh, radius, false);
      const iconSize = Math.min(bw * 0.42, bh * 0.4);
      b.icon.setDisplaySize(iconSize, iconSize).setPosition(0, -bh * 0.12);
      // Narrow bins (phones) use short labels so the text stays large enough to read.
      const narrow = bw < unit * 30;
      const fontSize = narrow
        ? Phaser.Math.Clamp(bw * 0.17, unit * 3, unit * 4.2)
        : Phaser.Math.Clamp(bw * 0.1, unit * 2.6, unit * 3.6);
      b.label
        .setText(narrow ? b.bin.shortLabel : b.bin.label)
        .setFontSize(fontSize)
        .setWordWrapWidth(bw * 0.92)
        .setPosition(0, bh * 0.14);
      b.badge
        .setFontSize(unit * 3)
        .setPosition(-bw / 2 + unit * 3.2, -bh / 2 + bh * 0.14 + unit * 3.2);
      b.zone.setPosition(x + bw / 2, this.binTop + bh / 2).setSize(bw, bh);
    });

    for (const f of this.falling) {
      f.box.x = Phaser.Math.Clamp(f.box.x, this.tokenRadius, W - this.tokenRadius);
    }
  }

  private drawBin(b: BinView, bw: number, bh: number, radius: number, active: boolean): void {
    const g = b.body;
    g.clear();
    const lid = bh * 0.14;
    g.fillStyle(0x000000, 0.12);
    g.fillRoundedRect(-bw / 2 + 2, -bh / 2 + 6, bw, bh, radius);
    g.fillStyle(b.bin.color, 1);
    g.fillRoundedRect(-bw / 2, -bh / 2 + lid * 0.6, bw, bh - lid * 0.6, radius);
    g.fillStyle(Phaser.Display.Color.ValueToColor(b.bin.color).darken(18).color, 1);
    g.fillRoundedRect(-bw / 2 - bw * 0.03, -bh / 2, bw * 1.06, lid, lid / 2);
    if (active) {
      g.lineStyle(this.unit * 1.2, 0xffffff, 1);
      g.strokeRoundedRect(-bw / 2, -bh / 2 + lid * 0.6, bw, bh - lid * 0.6, radius);
    }
    b.box.setData('size', { bw, bh, radius });
  }

  private highlightBin(target: BinView | null): void {
    for (const b of this.bins) {
      const size = b.box.getData('size') as { bw: number; bh: number; radius: number };
      const on = b === target;
      if (b.box.getData('active') === on) continue;
      b.box.setData('active', on);
      this.drawBin(b, size.bw, size.bh, size.radius, on);
    }
  }

  private binAt(x: number): BinView | null {
    const idx = Math.floor((x / this.W) * this.bins.length);
    return this.bins[Phaser.Math.Clamp(idx, 0, this.bins.length - 1)] ?? null;
  }

  private findFalling(obj: Phaser.GameObjects.GameObject): Falling | undefined {
    return this.falling.find((f) => f.box === obj);
  }

  private spawn(): void {
    const item = this.bag.next();
    const r = this.tokenRadius;
    let x = Phaser.Math.Between(Math.ceil(r * 1.4), Math.floor(this.W - r * 1.4));
    // Keep consecutive items apart so they don't overlap.
    if (this.lastSpawnX >= 0 && Math.abs(x - this.lastSpawnX) < r * 2.5) {
      x = x < this.W / 2 ? Math.min(this.W - r * 1.4, x + r * 3) : Math.max(r * 1.4, x - r * 3);
    }
    this.lastSpawnX = x;

    const token = this.add.graphics();
    token.fillStyle(0x000000, 0.15);
    token.fillCircle(0, r * 0.12, r);
    token.fillStyle(this.palette.token, 1);
    token.fillCircle(0, 0, r);
    token.lineStyle(this.unit * 0.5, this.palette.tokenStroke, 0.12);
    token.strokeCircle(0, 0, r);
    const img = this.add.image(0, 0, `item-${item.id}`).setDisplaySize(r * 1.15, r * 1.15);
    const label = this.add
      .text(0, r + this.unit * 0.8, item.name, {
        fontFamily: FONT,
        fontStyle: '700',
        fontSize: `${Math.round(this.unit * 2.8)}px`,
        color: this.palette.ink,
        backgroundColor: this.palette.labelBg,
        padding: { x: this.unit, y: this.unit * 0.3 },
      })
      .setOrigin(0.5, 0);
    const box = this.add.container(x, -r * 1.5, [token, img, label]);
    box.setSize(r * 2.4, r * 2.4);
    box.setInteractive({ draggable: true, useHandCursor: true });
    box.setScale(0.6);
    this.tweens.add({ targets: box, scale: 1, duration: 250, ease: 'Back.Out' });
    this.falling.push({ item, box, dragging: false, done: false });
  }

  /** Tap/keyboard alternative to dragging: sends the lowest item to a bin. */
  private sendLowestTo(bin: BinView): void {
    if (!this.running) return;
    const target = this.falling
      .filter((f) => !f.done && !f.dragging)
      .sort((a, b) => b.box.y - a.box.y)[0];
    if (target) this.resolve(target, bin);
  }

  private resolve(f: Falling, binView: BinView): void {
    if (f.done || !this.running) return;
    f.done = true;
    f.box.disableInteractive();
    const outcome = this.state.sort(f.item, binView.bin.id);
    this.hooks.onSort(f.item, binView.bin, outcome);
    this.hooks.onChange(this.state);

    if (outcome.correct) {
      this.floatText(f.box.x, f.box.y - this.tokenRadius, `+${outcome.points}`, '#23884f');
      this.tweens.add({
        targets: f.box,
        x: binView.box.x,
        y: binView.box.y,
        scale: 0.2,
        alpha: 0,
        duration: 260,
        ease: 'Quad.In',
        onComplete: () => f.box.destroy(),
      });
      this.tweens.add({ targets: binView.box, scaleY: 0.92, duration: 90, yoyo: true });
    } else {
      this.showCorrectBin(f, f.item.bin);
    }
    if (outcome.gameOver) this.endRun();
  }

  private missed(f: Falling): void {
    f.done = true;
    f.box.disableInteractive();
    const outcome = this.state.miss(f.item);
    this.hooks.onMiss(f.item, outcome);
    this.hooks.onChange(this.state);
    this.showCorrectBin(f, f.item.bin);
    if (outcome.gameOver) this.endRun();
  }

  /** On a mistake, shake the item then move it to where it should have gone. */
  private showCorrectBin(f: Falling, correct: BinId): void {
    const target = this.bins.find((b) => b.bin.id === correct);
    this.cameras.main.shake(160, 0.004);
    this.floatText(f.box.x, f.box.y - this.tokenRadius, '✗', '#c8412c');
    this.tweens.chain({
      targets: f.box,
      tweens: [
        { x: f.box.x - this.unit, duration: 50, yoyo: true, repeat: 2 },
        {
          x: target?.box.x ?? f.box.x,
          y: target?.box.y ?? f.box.y,
          scale: 0.3,
          alpha: 0,
          duration: 500,
          ease: 'Quad.In',
        },
      ],
      onComplete: () => f.box.destroy(),
    });
    if (target) {
      const size = target.box.getData('size') as { bw: number; bh: number; radius: number };
      this.drawBin(target, size.bw, size.bh, size.radius, true);
      this.time.delayedCall(700, () => this.drawBin(target, size.bw, size.bh, size.radius, false));
    }
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y, text, {
        fontFamily: FONT,
        fontStyle: '800',
        fontSize: `${Math.round(this.unit * 5)}px`,
        color,
        stroke: '#ffffff',
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
    for (const f of this.falling) {
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

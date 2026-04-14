import { BladeTracker } from './Blade';
import {
  spawnObjectInZone,
  updateObjects,
  updateParticles,
  updateScorePopups,
  createSplashParticles,
  createPowerupParticles,
  createScorePopup,
  checkSliceCollision,
} from './Physics';
import {
  PLAYER_COLORS,
  triggerShake,
  beginFrame,
  endFrame,
  drawBackground,
  drawZoneDividers,
  drawObject,
  drawParticles,
  drawBlade,
  drawScorePopups,
  drawFactPopup,
  drawCarbonSpikeOverlay,
  drawSlowMoOverlay,
  drawChampionBadge,
} from './Renderer';
import { audio } from './Audio';
import { applyPowerup, tickPowerups, hasPowerup } from './Powerups';
import {
  GREENHOUSE_GASES,
  DIFFICULTY_TABLE,
  MAX_LIVES,
  COMBO_RESET_FRAMES,
  CARBON_SPIKE_COMBO_THRESHOLD,
  FACT_POPUP_INTERVAL,
} from './data';
import type {
  GameMode,
  GameObject,
  Particle,
  ScorePopup,
  FactPopup,
  PlayerState,
  ZoneConfig,
  FrenzyState,
} from './types';

export interface GameCallbacks {
  onScoreUpdate: (playerIndex: number, score: number) => void;
  onLivesUpdate: (playerIndex: number, lives: number) => void;
  onComboUpdate: (playerIndex: number, combo: number) => void;
  onPowerupUpdate: (playerIndex: number, powerups: string[]) => void;
  onGameOver: (results: PlayerState[]) => void;
  onFrenzy: (playerIndex: number, active: boolean) => void;
}

const TARGET_DT = 1000 / 60;

function buildZones(mode: GameMode, w: number, h: number): ZoneConfig[] {
  if (mode === '2p' || mode === 'champion') {
    const half = w / 2;
    return [
      { playerId: 0, x: 0, y: 0, width: half, height: h },
      { playerId: 1, x: half, y: 0, width: half, height: h, spawnEdge: 'top' },
    ];
  }
  if (mode === '4p') {
    const hw = w / 2;
    const hh = h / 2;
    return [
      { playerId: 0, x: 0, y: 0, width: hw, height: hh, spawnEdge: 'top' },
      { playerId: 1, x: hw, y: 0, width: hw, height: hh, spawnEdge: 'top' },
      { playerId: 2, x: 0, y: hh, width: hw, height: hh, spawnEdge: 'bottom' },
      { playerId: 3, x: hw, y: hh, width: hw, height: hh, spawnEdge: 'bottom' },
    ];
  }
  return [{ playerId: 0, x: 0, y: 0, width: w, height: h }];
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: GameMode;
  private speedMult: number;
  private callbacks: GameCallbacks;

  private zones: ZoneConfig[] = [];
  private players: PlayerState[] = [];
  private blades: BladeTracker[] = [];
  private zoneObjects: GameObject[][] = [];
  private zoneParticles: Particle[][] = [];
  private zonePopups: ScorePopup[][] = [];
  private factPopup: FactPopup | null = null;

  private spawnTimers: number[] = [];
  private comboTimers: number[] = [];
  private frenzy: FrenzyState[] = [];
  private lastFactScore: number[] = [];

  private animFrame = 0;
  private running = false;
  private paused = false;
  private lastTime = 0;

  private touchZoneMap = new Map<number, number>();

  constructor(
    canvas: HTMLCanvasElement,
    mode: GameMode,
    playerNames: string[],
    speedMult: number,
    callbacks: GameCallbacks,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.mode = mode;
    this.speedMult = speedMult;
    this.callbacks = callbacks;

    const numPlayers = mode === '4p' ? 4 : mode === '2p' || mode === 'champion' ? 2 : 1;
    this.zones = buildZones(mode, canvas.width, canvas.height);

    for (let i = 0; i < numPlayers; i++) {
      this.players.push({
        id: i, score: 0, lives: MAX_LIVES, combo: 0, maxCombo: 0,
        itemsSliced: 0, isAlive: true, activePowerups: [], streak: 0, shieldActive: false,
      });
      this.blades.push(new BladeTracker());
      this.zoneObjects.push([]);
      this.zoneParticles.push([]);
      this.zonePopups.push([]);
      this.spawnTimers.push(DIFFICULTY_TABLE.baseSpawnInterval);
      this.comboTimers.push(0);
      this.frenzy.push({ active: false, endsAt: 0 });
      this.lastFactScore.push(0);
    }

    void playerNames; // stored for reference
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    audio.startMusic();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    audio.stopMusic();
  }

  pause(): void { this.paused = true; audio.stopMusic(); }

  resume(): void {
    this.paused = false;
    this.lastTime = performance.now();
    audio.startMusic();
  }

  handlePointerDown(x: number, y: number): void {
    const zi = this.getZone(x, y);
    this.blades[zi].isActive = true;
    this.blades[zi].addPoint(x, y);
  }

  handlePointerMove(x: number, y: number): void {
    for (const blade of this.blades) {
      if (blade.isActive) blade.addPoint(x, y);
    }
  }

  handlePointerUp(): void {
    for (let i = 0; i < this.blades.length; i++) {
      this.blades[i].isActive = false;
      this.blades[i].clear();
      if (this.players[i].combo > 0) this.comboTimers[i] = COMBO_RESET_FRAMES;
    }
  }

  handleTouchStart(touches: TouchList): void {
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      const { x, y } = this.touchToCanvas(t);
      const zi = this.getZone(x, y);
      this.touchZoneMap.set(t.identifier, zi);
      this.blades[zi].isActive = true;
      this.blades[zi].addPoint(x, y);
    }
  }

  handleTouchMove(touches: TouchList): void {
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      const zi = this.touchZoneMap.get(t.identifier);
      if (zi === undefined) continue;
      const { x, y } = this.touchToCanvas(t);
      this.blades[zi].addPoint(x, y);
    }
  }

  handleTouchEnd(touches: TouchList): void {
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      const zi = this.touchZoneMap.get(t.identifier);
      if (zi === undefined) continue;
      this.touchZoneMap.delete(t.identifier);
      if (!Array.from(this.touchZoneMap.values()).includes(zi)) {
        this.blades[zi].isActive = false;
        this.blades[zi].clear();
        if (this.players[zi].combo > 0) this.comboTimers[zi] = COMBO_RESET_FRAMES;
      }
    }
  }

  resize(w: number, h: number): void {
    this.zones = buildZones(this.mode, w, h);
  }

  getPlayers(): PlayerState[] { return this.players; }
  getZones(): ZoneConfig[] { return this.zones; }

  // ---- private ----

  private touchToCanvas(t: Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (t.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (t.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  private getZone(x: number, y: number): number {
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) return i;
    }
    return 0;
  }

  private loop = (time: number): void => {
    if (!this.running) return;
    const rawDt = time - this.lastTime;
    this.lastTime = time;

    if (!this.paused) {
      const dt = Math.min(rawDt, 50);
      const frames = dt / TARGET_DT;

      for (let zi = 0; zi < this.players.length; zi++) {
        if (this.players[zi].isAlive) {
          this.spawnForZone(zi, frames);
          this.updateZone(zi, frames);
        }
      }

      if (this.factPopup) {
        this.factPopup.alpha -= 0.008 * frames;
        if (this.factPopup.alpha <= 0) this.factPopup = null;
      }

      this.checkGameOver();
    }

    this.render(time);
    this.animFrame = requestAnimationFrame(this.loop);
  };

  private spawnForZone(zi: number, frames: number): void {
    this.spawnTimers[zi] -= frames;
    if (this.spawnTimers[zi] > 0) return;

    const score = this.players[zi].score;
    const isFrenzy = this.frenzy[zi].active;
    const reduction = Math.min(score / DIFFICULTY_TABLE.reductionPerScore, DIFFICULTY_TABLE.maxReduction);

    if (isFrenzy) {
      this.spawnTimers[zi] = Math.max(
        DIFFICULTY_TABLE.frenzyBaseInterval - Math.min(score / 30, 25),
        DIFFICULTY_TABLE.frenzyMinInterval,
      );
    } else {
      this.spawnTimers[zi] = Math.max(
        DIFFICULTY_TABLE.baseSpawnInterval - reduction,
        DIFFICULTY_TABLE.minSpawnInterval,
      );
    }

    const isSlowMo = hasPowerup(this.players[zi], 'slowmo');
    this.zoneObjects[zi].push(
      spawnObjectInZone(this.zones[zi], score, isFrenzy, isSlowMo, this.speedMult),
    );

    if (isFrenzy && Math.random() < 0.4) {
      this.zoneObjects[zi].push(
        spawnObjectInZone(this.zones[zi], score, true, isSlowMo, this.speedMult),
      );
    }
  }

  private updateZone(zi: number, frames: number): void {
    const player = this.players[zi];
    const blade = this.blades[zi];
    const zone = this.zones[zi];
    const isSlowMo = hasPowerup(player, 'slowmo');
    const isDouble = hasPowerup(player, 'doublepoints');

    blade.update();

    // combo decay
    if (this.comboTimers[zi] > 0) {
      this.comboTimers[zi] -= frames;
      if (this.comboTimers[zi] <= 0) {
        player.combo = 0;
        this.callbacks.onComboUpdate(zi, 0);
      }
    }

    // frenzy decay
    if (this.frenzy[zi].active) {
      this.frenzy[zi].endsAt -= frames;
      if (this.frenzy[zi].endsAt <= 0) {
        this.frenzy[zi].active = false;
        this.callbacks.onFrenzy(zi, false);
      }
    }

    // powerup decay
    tickPowerups(player);
    this.callbacks.onPowerupUpdate(zi, player.activePowerups.map(p => p.type));

    // physics
    updateObjects(this.zoneObjects[zi], zone, frames, isSlowMo, this.speedMult);
    updateParticles(this.zoneParticles[zi], frames);
    updateScorePopups(this.zonePopups[zi], frames);

    // collision
    const slice = blade.isActive ? blade.getActiveSlice() : [];

    for (const obj of this.zoneObjects[zi]) {
      if (obj.sliced || obj.offScreen) continue;

      // missed GHG
      const margin = obj.def.size * 2;
      if (obj.y > zone.y + zone.height + margin || obj.y < zone.y - margin - 200 ||
          obj.x < zone.x - margin - 200 || obj.x > zone.x + zone.width + margin) {
        obj.offScreen = true;
        if (obj.def.kind === 'ghg') {
          player.lives--;
          player.combo = 0;
          this.comboTimers[zi] = 0;
          triggerShake(6, 10);
          audio.playMiss();
          this.callbacks.onLivesUpdate(zi, player.lives);
          this.callbacks.onComboUpdate(zi, 0);
          if (player.lives <= 0) player.isAlive = false;
        }
        continue;
      }

      // blade hit
      if (slice.length >= 2 && checkSliceCollision(obj, slice)) {
        obj.sliced = true;

        if (obj.def.kind === 'ghg') {
          const comboMult = Math.max(1, player.combo);
          const points = obj.def.points * comboMult * (isDouble ? 2 : 1);
          player.score += points;
          player.itemsSliced++;
          player.combo++;
          this.comboTimers[zi] = COMBO_RESET_FRAMES;
          if (player.combo > player.maxCombo) player.maxCombo = player.combo;

          this.zoneParticles[zi].push(...createSplashParticles(obj));
          this.zonePopups[zi].push(createScorePopup(obj, comboMult, isDouble));
          audio.playSlash(player.combo);

          if (player.combo > 0 && player.combo % 5 === 0) audio.playCombo(player.combo);

          this.callbacks.onScoreUpdate(zi, player.score);
          this.callbacks.onComboUpdate(zi, player.combo);

          if (player.combo >= CARBON_SPIKE_COMBO_THRESHOLD && !this.frenzy[zi].active) {
            this.frenzy[zi].active = true;
            this.frenzy[zi].endsAt = 480;
            this.callbacks.onFrenzy(zi, true);
          }

          if (player.score - this.lastFactScore[zi] >= FACT_POPUP_INTERVAL) {
            this.lastFactScore[zi] = player.score;
            const gas = GREENHOUSE_GASES[Math.floor(Math.random() * GREENHOUSE_GASES.length)];
            this.factPopup = { text: `${gas.formula}: ${gas.fact}`, alpha: 1.0 };
          }
        } else if (obj.def.kind === 'cleantech') {
          if (player.shieldActive) {
            player.shieldActive = false;
            this.zoneParticles[zi].push(...createPowerupParticles(obj));
          } else {
            player.lives--;
            player.combo = 0;
            this.comboTimers[zi] = 0;
            triggerShake(12, 15);
            audio.playProtectedHit();
            const warn: ScorePopup = {
              id: Date.now(), x: obj.x, y: obj.y - obj.def.size,
              text: `⚠️ ${obj.def.label}!`, alpha: 1, vy: -1.2, color: '#FF4757',
            };
            this.zonePopups[zi].push(warn);
            this.callbacks.onLivesUpdate(zi, player.lives);
            this.callbacks.onComboUpdate(zi, 0);
            if (player.lives <= 0) player.isAlive = false;
          }
        } else if (obj.def.kind === 'powerup' && obj.def.powerupType) {
          applyPowerup(player, obj.def.powerupType, this.zoneObjects[zi]);
          this.zoneParticles[zi].push(...createPowerupParticles(obj));
          const announce: ScorePopup = {
            id: Date.now(), x: obj.x, y: obj.y - obj.def.size,
            text: obj.def.label || 'Powerup!', alpha: 1, vy: -1.5, color: obj.def.color,
          };
          this.zonePopups[zi].push(announce);
          audio.playPowerup(obj.def.powerupType);
          this.callbacks.onPowerupUpdate(zi, player.activePowerups.map(p => p.type));
          this.callbacks.onLivesUpdate(zi, player.lives);
        }
      }
    }

    // cleanup
    this.zoneObjects[zi] = this.zoneObjects[zi].filter(o => !o.offScreen && !o.sliced);
    if (this.zoneObjects[zi].length > 40) this.zoneObjects[zi] = this.zoneObjects[zi].slice(-40);
    this.zoneParticles[zi] = this.zoneParticles[zi].filter(p => p.life > 0);
    this.zonePopups[zi] = this.zonePopups[zi].filter(p => p.alpha > 0);
  }

  private checkGameOver(): void {
    const alive = this.players.filter(p => p.isAlive);
    if (this.mode === '1p') {
      if (alive.length === 0) this.endGame();
    } else {
      if (alive.length <= 1) this.endGame();
    }
  }

  private endGame(): void {
    this.running = false;
    audio.stopMusic();
    audio.playGameOver();
    this.callbacks.onGameOver([...this.players]);
  }

  private render(time: number): void {
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;

    beginFrame(ctx);
    drawBackground(ctx, w, h, time);

    if (this.players.length > 1) {
      drawZoneDividers(ctx, this.zones, this.players, time);
    }

    for (let zi = 0; zi < this.players.length; zi++) {
      if (!this.players[zi].isAlive) continue;
      const zone = this.zones[zi];

      ctx.save();
      ctx.beginPath();
      ctx.rect(zone.x, zone.y, zone.width, zone.height);
      ctx.clip();

      for (const obj of this.zoneObjects[zi]) drawObject(ctx, obj, time);
      drawParticles(ctx, this.zoneParticles[zi]);
      if (this.blades[zi].isActive) drawBlade(ctx, this.blades[zi].getPoints(), PLAYER_COLORS[zi]);
      drawScorePopups(ctx, this.zonePopups[zi]);

      if (this.frenzy[zi].active) drawCarbonSpikeOverlay(ctx, zone, time);
      if (hasPowerup(this.players[zi], 'slowmo')) drawSlowMoOverlay(ctx, w, h);
      if (this.mode === 'champion' && this.players[zi].streak > 0) {
        drawChampionBadge(ctx, zone, this.players[zi].streak);
      }

      ctx.restore();
    }

    if (this.factPopup) drawFactPopup(ctx, this.factPopup, w, h);

    endFrame(ctx);
  }
}

import type { GameObject, Particle, ScorePopup, ZoneConfig, SlicedHalf, FogPatch } from './types';
import { pickRandomObject, CRITICAL_BONUS_MULT } from './data';

export const GRAVITY = 0.28;
const PARTICLE_GRAVITY = 0.18;
export const SLOW_MO_FACTOR = 0.38;

const REFERENCE_AREA = 1280 * 720;

let instanceCounter = 0;
let particleCounter = 0;
let popupCounter = 0;
let halfCounter = 0;
let fogCounter = 0;

function computeSizeScale(zone: ZoneConfig): number {
  const zoneArea = zone.width * zone.height;
  const scale = Math.sqrt(zoneArea / REFERENCE_AREA);
  return Math.min(Math.max(scale, 0.48), 1.0);
}

export function spawnObjectInZone(
  zone: ZoneConfig,
  score: number,
  isFrenzy: boolean,
  slowMo: boolean,
  speedMult = 1,
  cleantechOverride?: number,
  powerupOverride?: number,
  focusGases?: string[],
): GameObject {
  const baseDef = pickRandomObject(score, isFrenzy, cleantechOverride, powerupOverride, focusGases);
  const sizeScale = computeSizeScale(zone);
  const def = sizeScale < 0.99 ? { ...baseDef, size: Math.round(baseDef.size * sizeScale) } : baseDef;

  const spawnEdge = zone.spawnEdge ?? 'bottom';

  // Heavy gases fall faster
  const gravMult = def.behavior === 'heavy' ? 1.35 : 1.0;

  if (spawnEdge === 'left' || spawnEdge === 'right') {
    const margin = def.size + 8;
    const y = zone.y + margin + Math.random() * (zone.height - margin * 2);
    const x = spawnEdge === 'left'
      ? zone.x - def.size
      : zone.x + zone.width + def.size;

    const speedScale = 0.45 + Math.min(score / 500, 0.45);
    const targetFrames = (38 + Math.random() * 22) / speedScale;
    let vx = (zone.width / targetFrames) * speedMult;
    if (spawnEdge === 'right') vx = -vx;
    if (slowMo) vx *= SLOW_MO_FACTOR;

    const vy = (Math.random() - 0.5) * 3 * speedMult;

    return {
      instanceId: ++instanceCounter,
      def,
      x,
      y,
      vx,
      vy,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      sliced: false,
      offScreen: false,
      visible: true,
      blinkTimer: def.behavior === 'blink' ? 45 : undefined,
      gravityMult: gravMult,
    };
  }

  const margin = 60;
  const x = zone.x + margin + Math.random() * (zone.width - margin * 2);

  const peakFraction = 0.55 + Math.min(score / 1000, 0.20);
  const jitter = (Math.random() - 0.5) * 0.06;
  const clampedFraction = Math.min(Math.max(peakFraction + jitter, 0.50), 0.80);
  const dy = zone.height * clampedFraction + def.size;

  if (spawnEdge === 'top') {
    const ySpawn = zone.y - def.size;
    let vy = Math.sqrt(2 * GRAVITY * dy) * speedMult * gravMult;
    if (slowMo) vy *= SLOW_MO_FACTOR;
    const vx = (Math.random() - 0.5) * 4 * speedMult;

    return {
      instanceId: ++instanceCounter,
      def,
      x,
      y: ySpawn,
      vx,
      vy,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      sliced: false,
      offScreen: false,
      visible: true,
      blinkTimer: def.behavior === 'blink' ? 45 : undefined,
      gravityMult: gravMult,
    };
  }

  const ySpawn = zone.y + zone.height + def.size;
  let vy = -Math.sqrt(2 * GRAVITY * dy) * speedMult * gravMult;
  if (slowMo) vy *= SLOW_MO_FACTOR;
  const vx = (Math.random() - 0.5) * 4 * speedMult;

  return {
    instanceId: ++instanceCounter,
    def,
    x,
    y: ySpawn,
    vx,
    vy,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.08,
    sliced: false,
    offScreen: false,
    visible: true,
    blinkTimer: def.behavior === 'blink' ? 45 : undefined,
    gravityMult: gravMult,
  };
}

export function updateObjects(
  objects: GameObject[],
  zone: ZoneConfig,
  dt: number,
  slowMo: boolean,
  speedMult = 1,
): void {
  const baseG = GRAVITY * (slowMo ? SLOW_MO_FACTOR : 1) * speedMult;
  const spawnEdge = zone.spawnEdge ?? 'bottom';

  for (const obj of objects) {
    if (obj.sliced || obj.offScreen) continue;

    // Blink behavior — toggle visibility
    if (obj.blinkTimer !== undefined) {
      obj.blinkTimer -= dt;
      if (obj.blinkTimer <= 0) {
        obj.visible = !obj.visible;
        // Faster blinking as game progresses
        obj.blinkTimer = obj.visible ? 35 + Math.random() * 20 : 15 + Math.random() * 15;
      }
    }

    const g = baseG * (obj.gravityMult ?? 1.0);

    if (spawnEdge === 'top') {
      obj.vy -= g * dt;
    } else {
      obj.vy += g * dt;
    }

    obj.x += obj.vx * dt;
    obj.y += obj.vy * dt;
    obj.rotation += obj.rotationSpeed * dt;

    const halfSize = obj.def.size * 0.5;

    if (spawnEdge === 'left' || spawnEdge === 'right') {
      const minY = zone.y + halfSize;
      const maxY = zone.y + zone.height - halfSize;
      if (obj.y < minY) { obj.y = minY; obj.vy = Math.abs(obj.vy) * 0.6; }
      else if (obj.y > maxY) { obj.y = maxY; obj.vy = -Math.abs(obj.vy) * 0.6; }

      if (spawnEdge === 'left' && obj.x > zone.x + zone.width + obj.def.size * 2) {
        obj.offScreen = true;
      } else if (spawnEdge === 'right' && obj.x < zone.x - obj.def.size * 2) {
        obj.offScreen = true;
      }
    } else if (spawnEdge === 'top') {
      const minX = zone.x + halfSize;
      const maxX = zone.x + zone.width - halfSize;
      if (obj.x < minX) { obj.x = minX; obj.vx = Math.abs(obj.vx) * 0.6; }
      else if (obj.x > maxX) { obj.x = maxX; obj.vx = -Math.abs(obj.vx) * 0.6; }

      if (obj.y < zone.y - obj.def.size * 2) {
        obj.offScreen = true;
      }
    } else {
      const minX = zone.x + halfSize;
      const maxX = zone.x + zone.width - halfSize;
      if (obj.x < minX) { obj.x = minX; obj.vx = Math.abs(obj.vx) * 0.6; }
      else if (obj.x > maxX) { obj.x = maxX; obj.vx = -Math.abs(obj.vx) * 0.6; }

      if (obj.y > zone.y + zone.height + obj.def.size * 2) {
        obj.offScreen = true;
      }
    }
  }
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (const p of particles) {
    p.vy += PARTICLE_GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
  }
}

export function updateScorePopups(popups: ScorePopup[], dt: number): void {
  for (const popup of popups) {
    popup.y += popup.vy * dt;
    popup.alpha = Math.max(0, popup.alpha - 0.022 * dt);
    if (popup.bounce && popup.bounce > 0) {
      popup.bounce = Math.max(0, popup.bounce - 0.06 * dt);
    }
  }
}

/** Update split halves — they fly apart and fade */
export function updateSlicedHalves(halves: SlicedHalf[], dt: number): void {
  for (const h of halves) {
    h.vy += PARTICLE_GRAVITY * dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.rotation += h.rotationSpeed * dt;
    h.alpha = Math.max(0, h.alpha - 0.018 * dt);
  }
}

/** Update fog patches — expand and fade */
export function updateFogPatches(fogs: FogPatch[], dt: number): void {
  for (const f of fogs) {
    if (f.radius < f.maxRadius) {
      f.radius += 0.8 * dt;
    }
    f.alpha = Math.max(0, f.alpha - 0.006 * dt);
  }
}

export function createSplashParticles(obj: GameObject): Particle[] {
  const count = 20 + Math.floor(Math.random() * 10);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 3 + Math.random() * 8;
    const life = 30 + Math.random() * 30;
    const ecoColors = ['#14CC66', '#0D9B4A', '#1B8EBF', '#23B5E8', obj.def.color];
    const color = obj.def.kind === 'ghg' ? ecoColors[Math.floor(Math.random() * ecoColors.length)] : obj.def.splatColor;
    particles.push({
      id: ++particleCounter,
      x: obj.x,
      y: obj.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      color,
      alpha: 1,
      radius: 4 + Math.random() * 7,
      life,
      maxLife: life,
    });
  }
  if (obj.def.kind === 'ghg') {
    const fontSize = obj.def.size * 0.55;
    for (let h = 0; h < 2; h++) {
      const dir = h === 0 ? -1 : 1;
      const life = 28 + Math.random() * 20;
      particles.push({
        id: ++particleCounter,
        x: obj.x,
        y: obj.y,
        vx: dir * (1.5 + Math.random() * 2),
        vy: -(2 + Math.random() * 2),
        color: obj.def.splatColor,
        alpha: 1,
        radius: fontSize,
        life,
        maxLife: life,
        emoji: obj.def.emoji,
      });
    }
  }
  return particles;
}

/** Create split halves when an object is sliced */
export function createSplitHalves(obj: GameObject): SlicedHalf[] {
  const size = obj.def.size * 0.45;
  return [
    {
      id: ++halfCounter,
      emoji: obj.def.emoji,
      x: obj.x - 5,
      y: obj.y,
      vx: -(2 + Math.random() * 3),
      vy: -(3 + Math.random() * 2),
      rotation: obj.rotation,
      rotationSpeed: -(0.08 + Math.random() * 0.06),
      alpha: 1,
      side: -1,
      color: obj.def.color,
      size,
    },
    {
      id: ++halfCounter,
      emoji: obj.def.emoji,
      x: obj.x + 5,
      y: obj.y,
      vx: 2 + Math.random() * 3,
      vy: -(3 + Math.random() * 2),
      rotation: obj.rotation,
      rotationSpeed: 0.08 + Math.random() * 0.06,
      alpha: 1,
      side: 1,
      color: obj.def.color,
      size,
    },
  ];
}

/** Create fog cloud when CH₄ escapes */
export function createFogPatch(x: number, y: number): FogPatch {
  return {
    id: ++fogCounter,
    x,
    y,
    radius: 20,
    alpha: 0.6,
    maxRadius: 80 + Math.random() * 40,
  };
}

export function createPowerupParticles(obj: GameObject): Particle[] {
  const count = 16;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 3 + Math.random() * 4;
    const life = 35 + Math.random() * 25;
    particles.push({
      id: ++particleCounter,
      x: obj.x,
      y: obj.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: obj.def.color,
      alpha: 1,
      radius: 4 + Math.random() * 4,
      life,
      maxLife: life,
    });
  }
  return particles;
}

export function createScorePopup(
  obj: GameObject,
  combo: number,
  doublePoints = false,
  isCritical = false,
): ScorePopup {
  const base = obj.def.points * (combo > 1 ? combo : 1);
  const critMult = isCritical ? CRITICAL_BONUS_MULT : 1;
  const points = Math.round(base * critMult * (doublePoints ? 2 : 1));
  const formula = obj.def.formula || obj.def.label;
  const critText = isCritical ? ' CRITICAL!' : '';
  const suffix = doublePoints ? ' 2x!' : combo > 1 ? ` x${combo}!` : '';
  const ppmText = obj.def.kind === 'ghg' ? ` -${points}ppm` : '';
  return {
    id: ++popupCounter,
    x: obj.x,
    y: obj.y - obj.def.size,
    text: `${formula}${ppmText} +${points}${suffix}${critText}`,
    alpha: 1,
    vy: -1.2,
    color: isCritical ? '#FF4500' : doublePoints ? '#FFD700' : combo > 2 ? '#FFD700' : combo > 1 ? '#14CC66' : '#0D9B4A',
    fontSize: isCritical ? 34 : combo > 5 ? 28 : 24,
    bounce: isCritical ? 1 : combo > 3 ? 0.5 : 0,
  };
}

/** Create a clean tech catch popup (landed safely) */
export function createCatchPopup(x: number, y: number, points: number): ScorePopup {
  return {
    id: ++popupCounter,
    x,
    y: y - 30,
    text: `♻️ SAFE! +${points}`,
    alpha: 1,
    vy: -1.5,
    color: '#27ae60',
    fontSize: 26,
    bounce: 0.6,
  };
}

export function checkSliceCollision(
  obj: GameObject,
  bladePoints: Array<{ x: number; y: number }>,
): boolean {
  if (obj.sliced || obj.offScreen || bladePoints.length < 2) return false;
  // Blinking objects are only hittable when visible
  if (obj.visible === false) return false;
  const hitRadius = obj.def.size * 0.45;
  for (let i = 0; i < bladePoints.length - 1; i++) {
    const p1 = bladePoints[i];
    const p2 = bladePoints[i + 1];
    if (segmentCircleIntersect(p1.x, p1.y, p2.x, p2.y, obj.x, obj.y, hitRadius)) {
      return true;
    }
  }
  return false;
}

/** Calculate blade velocity from the last few points */
export function calculateBladeVelocity(points: Array<{ x: number; y: number; time: number }>): number {
  if (points.length < 2) return 0;
  const p1 = points[points.length - 2];
  const p2 = points[points.length - 1];
  const dt = Math.max(p2.time - p1.time, 1);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy) / dt * 16.67; // normalize to ~per-frame
}

function segmentCircleIntersect(
  x1: number, y1: number,
  x2: number, y2: number,
  cx: number, cy: number,
  r: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;
  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

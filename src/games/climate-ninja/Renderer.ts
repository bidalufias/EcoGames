import type { GameObject, Particle, BladePoint, ScorePopup, ZoneConfig, PlayerState, FactPopup, SlicedHalf, FogPatch } from './types';

export const PLAYER_COLORS = ['#8BC53F', '#007DC4', '#FF9800', '#E91E63'];

let _shakeStrength = 0;
let _shakeFrames = 0;

export function triggerShake(strength: number, frames = 8): void {
  _shakeStrength = Math.max(_shakeStrength, strength);
  _shakeFrames = Math.max(_shakeFrames, frames);
}

export function beginFrame(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  if (_shakeFrames > 0) {
    const dx = (Math.random() - 0.5) * _shakeStrength * 2;
    const dy = (Math.random() - 0.5) * _shakeStrength * 2;
    ctx.translate(dx, dy);
    _shakeStrength *= 0.80;
    _shakeFrames--;
  }
}

export function endFrame(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}

export function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, now: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a1628');
  gradient.addColorStop(0.4, '#0d1b30');
  gradient.addColorStop(1, '#091322');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  drawStars(ctx, width, height, now);
  drawAurora(ctx, width, height, now);
  drawHorizonGlow(ctx, width, height);
}

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number, now: number): void {
  ctx.save();
  const seed = Math.floor(width * height);
  let s = seed;
  for (let i = 0; i < 80; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const x = Math.abs(s) % width;
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const y = Math.abs(s) % (height * 0.6);
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const baseR = 0.5 + (Math.abs(s) % 100) / 100;
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const baseA = 0.3 + (Math.abs(s) % 100) / 150;
    const twinkle = 0.5 + Math.sin(now * 0.002 + i * 1.7) * 0.5;
    const r = baseR * (0.8 + twinkle * 0.4);
    const a = baseA * (0.6 + twinkle * 0.4);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,230,255,${a})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawAurora(ctx: CanvasRenderingContext2D, width: number, height: number, now: number): void {
  ctx.save();
  ctx.globalAlpha = 0.08;
  const t = now * 0.0003;

  ctx.beginPath();
  ctx.moveTo(0, height * 0.15);
  for (let x = 0; x <= width; x += 20) {
    const y = height * 0.15 + Math.sin(x * 0.005 + t) * 30 + Math.sin(x * 0.01 + t * 1.3) * 15;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height * 0.35);
  for (let x = width; x >= 0; x -= 20) {
    const y = height * 0.35 + Math.sin(x * 0.006 + t * 0.8) * 25;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  const auroraGrad = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.4);
  auroraGrad.addColorStop(0, '#8BC53F');
  auroraGrad.addColorStop(0.5, '#007DC4');
  auroraGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = auroraGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, height * 0.2);
  for (let x = 0; x <= width; x += 25) {
    const y = height * 0.2 + Math.sin(x * 0.004 + t * 1.5 + 2) * 20 + Math.cos(x * 0.008 + t) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height * 0.38);
  for (let x = width; x >= 0; x -= 25) {
    const y = height * 0.38 + Math.sin(x * 0.005 + t * 0.7 + 1) * 20;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  const blueGrad = ctx.createLinearGradient(0, height * 0.15, 0, height * 0.4);
  blueGrad.addColorStop(0, '#007DC4');
  blueGrad.addColorStop(0.5, '#23B5E8');
  blueGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = blueGrad;
  ctx.fill();

  ctx.restore();
}

function drawHorizonGlow(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createRadialGradient(width / 2, height, 0, width / 2, height, width * 0.8);
  gradient.addColorStop(0, 'rgba(13,155,74,0.12)');
  gradient.addColorStop(1, 'rgba(13,155,74,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function drawZoneDividers(
  ctx: CanvasRenderingContext2D,
  zones: ZoneConfig[],
  _players: PlayerState[],
  now: number,
): void {
  if (zones.length <= 1) return;
  ctx.save();
  const dashOffset = (now * 0.05) % 20;
  ctx.setLineDash([10, 10]);
  ctx.lineDashOffset = -dashOffset;
  ctx.lineWidth = 2;

  const seen = new Set<number>();
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const rightX = z.x + z.width;
    const bottomY = z.y + z.height;
    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.height;

    if (rightX < canvasW && !seen.has(rightX)) {
      seen.add(rightX);
      const c1 = PLAYER_COLORS[i % 4];
      const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
      grad.addColorStop(0, c1 + '66');
      grad.addColorStop(1, c1 + '22');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rightX, 0);
      ctx.lineTo(rightX, canvasH);
      ctx.stroke();
    }

    if (bottomY < canvasH && !seen.has(bottomY + 10000)) {
      seen.add(bottomY + 10000);
      ctx.strokeStyle = 'rgba(13,155,74,0.2)';
      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      ctx.lineTo(canvasW, bottomY);
      ctx.stroke();
    }
  }

  ctx.setLineDash([]);
  ctx.restore();
}

export function drawObject(ctx: CanvasRenderingContext2D, obj: GameObject, now: number): void {
  if (obj.sliced) return;
  // Blink: skip rendering when invisible
  if (obj.visible === false) return;
  ctx.save();
  ctx.translate(obj.x, obj.y);

  const isPowerup = obj.def.kind === 'powerup';
  const isCleanTech = obj.def.kind === 'cleantech';
  const pulseScale = (isCleanTech || isPowerup) ? 1 + Math.sin(now * 0.004) * 0.05 : 1;
  const size = obj.def.size * pulseScale;

  if (isPowerup) {
    ctx.shadowColor = obj.def.color;
    ctx.shadowBlur = 20 + Math.sin(now * 0.005) * 8;
    const orbitAngle = now * 0.003;
    ctx.save();
    ctx.rotate(-obj.rotation);
    for (let i = 0; i < 4; i++) {
      const angle = orbitAngle + (Math.PI * 2 * i) / 4;
      const ox = Math.cos(angle) * (size * 0.7);
      const oy = Math.sin(angle) * (size * 0.7);
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fillStyle = obj.def.color + 'cc';
      ctx.fill();
    }
    ctx.restore();
  } else if (isCleanTech) {
    ctx.shadowColor = '#8BC53F';
    ctx.shadowBlur = 22;
    // Green shield circle — now with landing zone indicator
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(13,155,74,${0.4 + Math.sin(now * 0.005) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Downward arrow hint
    ctx.fillStyle = `rgba(13,155,74,${0.3 + Math.sin(now * 0.006) * 0.2})`;
    ctx.font = `${size * 0.35}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⬇', 0, size * 0.4);
  } else {
    // GHG glow
    ctx.shadowColor = obj.def.color;
    ctx.shadowBlur = 10;

    // Heavy gas: larger glow aura
    if (obj.gravityMult && obj.gravityMult > 1.2) {
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(243,156,18,${0.1 + Math.sin(now * 0.004) * 0.05})`;
      ctx.fill();
    }

    // Blinking gas: flicker the glow
    if (obj.blinkTimer !== undefined) {
      ctx.globalAlpha = 0.7 + Math.sin(now * 0.02) * 0.3;
    }
  }

  ctx.rotate(obj.rotation);
  ctx.font = `${size}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(obj.def.emoji, 0, 0);

  if (isCleanTech) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,80,80,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    const cs = size * 0.22;
    ctx.strokeStyle = 'rgba(255,80,80,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-cs, -cs); ctx.lineTo(cs, cs);
    ctx.moveTo(cs, -cs); ctx.lineTo(-cs, cs);
    ctx.stroke();
  }

  ctx.restore();
}

/** Draw split halves flying apart */
export function drawSlicedHalves(ctx: CanvasRenderingContext2D, halves: SlicedHalf[]): void {
  for (const h of halves) {
    if (h.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = h.alpha;
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rotation);

    // Clip to show only left or right half
    ctx.beginPath();
    if (h.side === -1) {
      ctx.rect(-h.size * 1.5, -h.size * 1.5, h.size * 1.5, h.size * 3);
    } else {
      ctx.rect(0, -h.size * 1.5, h.size * 1.5, h.size * 3);
    }
    ctx.clip();

    ctx.font = `${h.size * 2}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = h.color;
    ctx.shadowBlur = 8;
    ctx.fillText(h.emoji, 0, 0);

    // Trail glow
    ctx.shadowBlur = 0;
    ctx.globalAlpha = h.alpha * 0.4;
    ctx.beginPath();
    ctx.arc(h.side * -5, 0, h.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = h.color;
    ctx.fill();

    ctx.restore();
  }
}

/** Draw fog patches from missed CH₄ */
export function drawFogPatches(ctx: CanvasRenderingContext2D, fogs: FogPatch[]): void {
  for (const f of fogs) {
    if (f.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = f.alpha;
    const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
    gradient.addColorStop(0, 'rgba(139,69,19,0.25)');
    gradient.addColorStop(0.5, 'rgba(139,69,19,0.10)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    if (p.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    if (p.emoji) {
      ctx.font = `${p.radius}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, p.x, p.y);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawBlade(
  ctx: CanvasRenderingContext2D,
  points: BladePoint[],
  playerColor = '#8BC53F',
  combo: number = 0,
): void {
  if (points.length < 2) return;
  const now = performance.now();
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Combo escalation changes blade color and intensity
  let bladeColor = 'rgba(20,204,102,';
  let glowColor = playerColor;
  let extraWidth = 0;

  if (combo >= 30) {
    bladeColor = 'rgba(255,69,0,';    // Red-orange fire
    glowColor = '#FF4500';
    extraWidth = 6;
  } else if (combo >= 20) {
    bladeColor = 'rgba(255,165,0,';   // Orange
    glowColor = '#FFA500';
    extraWidth = 4;
  } else if (combo >= 10) {
    bladeColor = 'rgba(255,215,0,';   // Gold
    glowColor = '#FFD700';
    extraWidth = 2;
  }

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const age = now - p2.time;
    const alpha = Math.max(0, 1 - age / 180);
    const segProgress = i / points.length;
    const width = 4 + segProgress * 14 + extraWidth;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = `${bladeColor}${alpha * 0.9})`;
    ctx.lineWidth = width;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15 + combo;
    ctx.stroke();

    const hexAlpha = Math.round(alpha * 0.6 * 255).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = `${playerColor}${hexAlpha}`;
    ctx.lineWidth = width * 0.4;
    ctx.shadowBlur = 0;
    ctx.stroke();
  }

  // Tip glow — gets bigger with combo
  const tip = points[points.length - 1];
  if (tip) {
    const tipSize = 6 + Math.min(combo * 0.3, 8);
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, tipSize, 0, Math.PI * 2);
    ctx.fillStyle = bladeColor + '0.9)';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 + combo;
    ctx.fill();
  }

  ctx.restore();
}

export function drawScorePopups(ctx: CanvasRenderingContext2D, popups: ScorePopup[]): void {
  for (const popup of popups) {
    if (popup.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = popup.alpha;
    const fontSize = popup.fontSize ?? 24;
    const scale = popup.bounce ? 1 + popup.bounce * 0.4 : 1;
    ctx.font = `bold ${fontSize}px Inter, Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (scale !== 1) {
      ctx.translate(popup.x, popup.y);
      ctx.scale(scale, scale);
      ctx.translate(-popup.x, -popup.y);
    }
    ctx.fillStyle = popup.color;
    ctx.shadowColor = popup.color;
    ctx.shadowBlur = 12;
    ctx.fillText(popup.text, popup.x, popup.y);
    ctx.restore();
  }
}

export function drawFactPopup(ctx: CanvasRenderingContext2D, popup: FactPopup, width: number, height: number): void {
  if (popup.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = popup.alpha;
  const padding = 16;
  ctx.font = '14px Inter, Roboto, sans-serif';
  const textWidth = ctx.measureText(popup.text).width;
  const boxW = textWidth + padding * 2;
  const boxH = 36;
  const x = (width - boxW) / 2;
  const y = height * 0.12;

  ctx.fillStyle = 'rgba(13, 155, 74, 0.15)';
  ctx.strokeStyle = 'rgba(13, 155, 74, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8BC53F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(popup.text, width / 2, y + boxH / 2);
  ctx.restore();
}

export function drawCarbonSpikeOverlay(ctx: CanvasRenderingContext2D, zone: ZoneConfig, now: number): void {
  ctx.save();
  const alpha = 0.06 + Math.sin(now * 0.008) * 0.04;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#8BC53F';
  ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
  ctx.globalAlpha = 0.5 + Math.sin(now * 0.01) * 0.2;
  ctx.strokeStyle = '#8BC53F';
  ctx.lineWidth = 3;
  ctx.strokeRect(zone.x + 2, zone.y + 2, zone.width - 4, zone.height - 4);
  ctx.restore();
}

export function drawSlowMoOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#23B5E8';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawChampionBadge(ctx: CanvasRenderingContext2D, zone: ZoneConfig, streak: number): void {
  if (streak < 2) return;
  ctx.save();
  ctx.font = 'bold 13px Inter, Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 8;
  ctx.fillText(`${streak}x CHAMP`, zone.x + zone.width - 8, zone.y + 8);
  ctx.restore();
}

/** Combo escalation — screen-edge glow at milestones */
export function drawComboEscalation(ctx: CanvasRenderingContext2D, w: number, h: number, combo: number, now: number): void {
  if (combo < 10) return;
  ctx.save();

  let color: string;
  let intensity: number;

  if (combo >= 30) {
    color = '#FF4500';
    intensity = 0.12 + Math.sin(now * 0.012) * 0.06;
  } else if (combo >= 20) {
    color = '#FFA500';
    intensity = 0.08 + Math.sin(now * 0.01) * 0.04;
  } else {
    color = '#FFD700';
    intensity = 0.05 + Math.sin(now * 0.008) * 0.03;
  }

  // Top/bottom edge glow
  const grad1 = ctx.createLinearGradient(0, 0, 0, h * 0.15);
  grad1.addColorStop(0, color);
  grad1.addColorStop(1, 'transparent');
  ctx.globalAlpha = intensity;
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, w, h * 0.15);

  const grad2 = ctx.createLinearGradient(0, h, 0, h * 0.85);
  grad2.addColorStop(0, color);
  grad2.addColorStop(1, 'transparent');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, h * 0.85, w, h * 0.15);

  // Side glow
  const grad3 = ctx.createLinearGradient(0, 0, w * 0.08, 0);
  grad3.addColorStop(0, color);
  grad3.addColorStop(1, 'transparent');
  ctx.fillStyle = grad3;
  ctx.fillRect(0, 0, w * 0.08, h);

  const grad4 = ctx.createLinearGradient(w, 0, w * 0.92, 0);
  grad4.addColorStop(0, color);
  grad4.addColorStop(1, 'transparent');
  ctx.fillStyle = grad4;
  ctx.fillRect(w * 0.92, 0, w * 0.08, h);

  ctx.restore();
}

/** Wave announcement — big text that fades in and out */
export function drawWaveAnnouncement(
  ctx: CanvasRenderingContext2D,
  text: string,
  emoji: string,
  progress: number, // 0 to 1 (1 = fully faded out)
  w: number,
  h: number,
): void {
  if (progress >= 1) return;
  ctx.save();

  const alpha = progress < 0.2
    ? progress / 0.2           // fade in
    : progress > 0.7
      ? (1 - progress) / 0.3  // fade out
      : 1;                     // hold

  ctx.globalAlpha = alpha;

  // Background dim
  ctx.fillStyle = 'rgba(10,22,40,0.4)';
  ctx.fillRect(0, h * 0.35, w, h * 0.3);

  // Emoji
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, w / 2, h * 0.43);

  // Wave name
  ctx.font = 'bold 32px Inter, Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#0D9B4A';
  ctx.shadowBlur = 20;
  ctx.fillText(text, w / 2, h * 0.53);

  ctx.restore();
}

/** Freeze frame flash for critical hits */
export function drawCriticalFlash(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha * 0.15;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

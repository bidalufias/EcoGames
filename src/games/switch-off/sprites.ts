// Top-down walking sprites for Switch Off!, drawn on a canvas when the game loads so
// every character matches the house art and needs no image files. Each sheet has three
// rows (facing down, up and right; left is right flipped) and three frames per row
// (standing, then a step with each foot).

export interface Look {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'spiky' | 'none';
  shirt: string;
  pants: string;
  shoes: string;
  /** A long skirt instead of trousers. */
  skirt?: string;
  headscarf?: string;
  songkok?: string;
  beard?: string;
  glasses?: boolean;
  cape?: string;
  mask?: string;
  /** Height compared with a grown-up. */
  scale: number;
}

const SKIN = '#9a6440';

/** How each character looks, by name (see FAMILY and PLAYER in content/energy.ts). */
export const LOOKS: Record<string, Look> = {
  Adik: {
    skin: SKIN,
    hair: '#2a1a12',
    hairStyle: 'spiky',
    shirt: '#f5b92e',
    pants: '#3a6fc4',
    shoes: '#e24b4b',
    scale: 0.78,
  },
  Ibu: {
    skin: SKIN,
    hair: '#2a1a12',
    hairStyle: 'none',
    headscarf: '#7b4fc0',
    shirt: '#e0628f',
    pants: '#e0628f',
    skirt: '#c84f7b',
    shoes: '#5b3a2a',
    scale: 1,
  },
  Abang: {
    skin: SKIN,
    hair: '#1d130e',
    hairStyle: 'short',
    shirt: '#ef7b35',
    pants: '#34485f',
    shoes: '#f2f2f2',
    scale: 0.92,
  },
  Atuk: {
    skin: '#8f5b3b',
    hair: '#d9d9d9',
    hairStyle: 'short',
    songkok: '#1c1c22',
    beard: '#ececec',
    glasses: true,
    shirt: '#2f8f83',
    pants: '#6b5a48',
    shoes: '#3b2a20',
    scale: 1,
  },
  You: {
    skin: SKIN,
    hair: '#3a2416',
    hairStyle: 'short',
    shirt: '#1f9d55',
    pants: '#1f4e8c',
    shoes: '#f5b92e',
    cape: '#e0453a',
    mask: '#e0453a',
    scale: 0.92,
  },
};

/** Frame size in drawing units. */
export const FRAME_W = 32;
export const FRAME_H = 40;
export type Facing = 'down' | 'up' | 'side';
const ROWS: readonly Facing[] = ['down', 'up', 'side'];
/** Frames per row: standing, left foot forward, right foot forward. */
export const STEPS = 3;

export function frameName(facing: Facing, step: number): string {
  return `${facing}-${step}`;
}

type Ctx = CanvasRenderingContext2D;
const OUTLINE = 'rgba(38, 24, 16, 0.55)';

function shape(ctx: Ctx, fill: string, draw: () => void, stroke = true): void {
  ctx.beginPath();
  draw();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  shape(ctx, fill, () => ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)));
}

function oval(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, stroke = true) {
  shape(ctx, fill, () => ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2), stroke);
}

function poly(ctx: Ctx, pts: [number, number][], fill: string, stroke = true): void {
  shape(
    ctx,
    fill,
    () => {
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
    },
    stroke,
  );
}

/** Shades a colour towards black (amount < 0) or white (amount > 0). */
function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${mix(n >> 16)}${mix((n >> 8) & 255)}${mix(n & 255)}`;
}

/** An arm hanging from the shoulder at (sx, sy), swung by `angle` radians. */
function arm(ctx: Ctx, look: Look, sx: number, sy: number, angle: number, shade = 0): void {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);
  rr(ctx, -1.8, -1, 3.6, 8.6, 1.8, tint(look.shirt, shade));
  oval(ctx, 0, 8.4, 1.75, 1.75, tint(look.skin, shade));
  ctx.restore();
}

function legsFront(ctx: Ctx, look: Look, step: number): void {
  const lift = [0, 1, -1][step]!;
  if (look.skirt) {
    oval(ctx, 13.3, 37.6 - Math.max(lift, 0) * 1.2, 2.2, 1.4, look.shoes);
    oval(ctx, 18.7, 37.6 - Math.max(-lift, 0) * 1.2, 2.2, 1.4, look.shoes);
    const sway = lift * 0.8;
    poly(
      ctx,
      [
        [11, 27],
        [21, 27],
        [22.8 + sway, 37],
        [9.2 + sway, 37],
      ],
      look.skirt,
    );
    return;
  }
  for (const [x, up] of [
    [11.4, Math.max(lift, 0)],
    [16.6, Math.max(-lift, 0)],
  ] as const) {
    const bottom = 37.8 - up * 1.6;
    rr(ctx, x, 28, 4, bottom - 28, 1.4, look.pants);
    oval(ctx, x + 2, bottom, 2.5, 1.5, look.shoes);
  }
}

function legsSide(ctx: Ctx, look: Look, step: number): void {
  const swing = [0, 1, -1][step]!;
  if (look.skirt) {
    oval(ctx, 17.5 + swing * 2, 37.6, 2.4, 1.4, tint(look.shoes, -0.2));
    oval(ctx, 17.5 - swing * 2, 37.6, 2.4, 1.4, look.shoes);
    poly(
      ctx,
      [
        [12.2, 27],
        [20.2, 27],
        [22 + swing * 0.6, 37],
        [10.6 + swing * 0.6, 37],
      ],
      look.skirt,
    );
    return;
  }
  // The far leg first, a little darker, then the near leg.
  for (const [dx, shade] of [
    [-swing * 2.6, -0.22],
    [swing * 2.6, 0],
  ] as const) {
    rr(ctx, 14.2 + dx, 28, 4, 9.6, 1.4, tint(look.pants, shade));
    oval(ctx, 17 + dx, 37.6, 2.8, 1.5, tint(look.shoes, shade));
  }
}

function eyes(ctx: Ctx, points: [number, number][]): void {
  for (const [x, y] of points) {
    oval(ctx, x, y, 1.15, 1.5, '#23160f', false);
    oval(ctx, x + 0.35, y - 0.5, 0.42, 0.42, '#ffffff', false);
  }
}

function cheek(ctx: Ctx, x: number, y: number): void {
  oval(ctx, x, y, 1.4, 0.9, 'rgba(235, 110, 110, 0.35)', false);
}

function frontHead(ctx: Ctx, look: Look, facing: 'down' | 'up'): void {
  const front = facing === 'down';
  if (look.headscarf) {
    oval(ctx, 16, 12, 10.2, 10.4, look.headscarf);
    if (front) {
      oval(ctx, 16, 13.4, 6.7, 6.9, look.skin);
      eyes(ctx, [
        [13.3, 13.9],
        [18.7, 13.9],
      ]);
      cheek(ctx, 12, 16.3);
      cheek(ctx, 20, 16.3);
    }
    return;
  }
  oval(ctx, 16, 12, 9.2, 9.2, look.skin);
  if (look.hairStyle === 'spiky') {
    for (const x of [10, 14, 18, 22]) {
      poly(
        ctx,
        [
          [x - 2.6, 6],
          [x, 0.8],
          [x + 2.6, 6],
        ],
        look.hair,
      );
    }
  }
  if (front) {
    // Hair on top, face below.
    shape(ctx, look.hair, () => {
      ctx.ellipse(16, 10.6, 9.8, 8.6, 0, Math.PI * 0.98, Math.PI * 2.02);
      ctx.quadraticCurveTo(22, 9, 16, 8.4);
      ctx.quadraticCurveTo(10, 9, 6.2, 10.9);
    });
    if (look.mask) {
      rr(ctx, 9.8, 11.8, 12.4, 4, 2, look.mask);
    }
    eyes(ctx, [
      [12.9, 14],
      [19.1, 14],
    ]);
    if (look.glasses) {
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 0.8;
      for (const x of [12.9, 19.1]) {
        ctx.beginPath();
        ctx.arc(x, 14, 2.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(15.3, 14);
      ctx.lineTo(16.7, 14);
      ctx.stroke();
    }
    if (look.beard) {
      shape(ctx, look.beard, () => {
        ctx.moveTo(9.5, 15.5);
        ctx.quadraticCurveTo(16, 25.5, 22.5, 15.5);
        ctx.quadraticCurveTo(16, 19.5, 9.5, 15.5);
      });
    } else {
      cheek(ctx, 11.3, 16.6);
      cheek(ctx, 20.7, 16.6);
      ctx.strokeStyle = '#5a2e22';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(16, 16.8, 1.4, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
  } else {
    oval(ctx, 16, 11.4, 9.6, 9.4, look.hair);
    if (look.mask) {
      poly(
        ctx,
        [
          [16, 13.5],
          [13, 16.5],
          [14.6, 12],
        ],
        look.mask,
      );
      poly(
        ctx,
        [
          [16, 13.5],
          [19, 16.5],
          [17.4, 12],
        ],
        look.mask,
      );
    }
  }
  if (look.songkok) rr(ctx, 8.4, 1.6, 15.2, 6.6, 2.2, look.songkok);
}

function sideHead(ctx: Ctx, look: Look): void {
  if (look.headscarf) {
    oval(ctx, 16, 12, 10.2, 10.4, look.headscarf);
    oval(ctx, 19.6, 13.4, 5.6, 6.6, look.skin);
    eyes(ctx, [[21.6, 13.8]]);
    cheek(ctx, 20.4, 16.4);
    return;
  }
  oval(ctx, 16.4, 12, 9.2, 9.2, look.skin);
  if (look.hairStyle === 'spiky') {
    for (const x of [9, 13, 17]) {
      poly(
        ctx,
        [
          [x - 2.6, 6],
          [x - 0.5, 0.8],
          [x + 2.6, 6],
        ],
        look.hair,
      );
    }
  }
  // Hair covers the back and top of the head; the face looks right.
  shape(ctx, look.hair, () => {
    ctx.ellipse(15.8, 11.2, 9.8, 9.2, 0, Math.PI * 0.55, Math.PI * 1.9);
    ctx.quadraticCurveTo(19, 9.4, 15.2, 11.2);
    ctx.quadraticCurveTo(14.2, 16, 12.6, 19.6);
  });
  oval(ctx, 14.6, 13.6, 1.6, 2, look.skin);
  if (look.mask) {
    rr(ctx, 16.4, 11.8, 9.4, 4, 2, look.mask);
    poly(
      ctx,
      [
        [16.8, 13],
        [11, 11],
        [12, 15.5],
      ],
      look.mask,
    );
  }
  eyes(ctx, [[21.8, 14]]);
  if (look.glasses) {
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(22, 14, 2.4, 0, Math.PI * 2);
    ctx.moveTo(19.6, 14);
    ctx.lineTo(15.6, 13.4);
    ctx.stroke();
  }
  if (look.beard) {
    shape(ctx, look.beard, () => {
      ctx.moveTo(16.5, 16);
      ctx.quadraticCurveTo(20.5, 24.5, 25.2, 16.4);
      ctx.quadraticCurveTo(21, 19, 16.5, 16);
    });
  } else {
    cheek(ctx, 20.6, 16.8);
  }
  if (look.songkok) rr(ctx, 8.4, 1.6, 15.6, 6.6, 2.2, look.songkok);
}

function drawFrame(ctx: Ctx, look: Look, facing: Facing, step: number): void {
  const bob = step === 0 ? 0 : -0.7;
  ctx.save();
  ctx.translate(0, bob);
  ctx.lineJoin = 'round';
  const swing = [0, 1, -1][step]!;

  if (facing === 'side') {
    if (look.cape) {
      poly(
        ctx,
        [
          [13.4, 19.6],
          [17, 19.6],
          [12.6, 35.2],
          [6.6 - Math.abs(swing), 33.2 + swing],
        ],
        look.cape,
      );
    }
    arm(ctx, look, 16.4, 21.4, -swing * 0.5, -0.25);
    legsSide(ctx, look, step);
    rr(ctx, 12, 19.4, 9, look.skirt ? 9 : 10.4, 3.6, look.shirt);
    if (look.headscarf) {
      poly(
        ctx,
        [
          [8, 13],
          [21.5, 15],
          [20.5, 23.5],
          [12, 25.5],
          [8.6, 20],
        ],
        look.headscarf,
      );
    }
    sideHead(ctx, look);
    arm(ctx, look, 16.6, 21.2, swing * 0.5);
  } else {
    const front = facing === 'down';
    if (look.cape && front) rr(ctx, 8.6, 19.2, 14.8, 16.6, 3, look.cape);
    legsFront(ctx, look, step);
    arm(ctx, look, 9.2, 21.2, 0.12 + (front ? swing : -swing) * 0.12);
    arm(ctx, look, 22.8, 21.2, -0.12 + (front ? swing : -swing) * 0.12);
    rr(ctx, 10, 19.4, 12, look.skirt ? 9 : 10.4, 4, look.shirt);
    if (!look.skirt) rr(ctx, 10.3, 27.6, 11.4, 2.2, 1, look.pants);
    if (look.cape && front) {
      oval(ctx, 16, 23.6, 2.6, 2.6, '#f7d046');
    }
    if (look.headscarf) {
      poly(
        ctx,
        front
          ? [
              [6.8, 13],
              [25.2, 13],
              [24.2, 22.6],
              [16, 26.4],
              [7.8, 22.6],
            ]
          : [
              [6.8, 13],
              [25.2, 13],
              [24.4, 25.6],
              [7.6, 25.6],
            ],
        look.headscarf,
      );
    }
    frontHead(ctx, look, front ? 'down' : 'up');
    if (look.cape && !front) {
      poly(
        ctx,
        [
          [10.4, 19.2],
          [21.6, 19.2],
          [24.2 + swing * 0.6, 35.6],
          [16, 34.4],
          [7.8 + swing * 0.6, 35.6],
        ],
        look.cape,
      );
    }
  }
  ctx.restore();
}

/**
 * Draws a character's sprite sheet: rows down, up, side; `STEPS` frames each.
 * `pixels` is canvas pixels per drawing unit.
 */
export function drawSheet(look: Look, pixels: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(FRAME_W * pixels * STEPS);
  canvas.height = Math.ceil(FRAME_H * pixels * ROWS.length);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ROWS.forEach((facing, row) => {
    for (let step = 0; step < STEPS; step++) {
      ctx.save();
      ctx.scale(pixels, pixels);
      ctx.translate(step * FRAME_W, row * FRAME_H);
      drawFrame(ctx, look, facing, step);
      ctx.restore();
    }
  });
  return canvas;
}

/** Where each frame sits on a sheet drawn at `pixels`, for adding frames to a texture. */
export function sheetFrames(pixels: number) {
  const w = FRAME_W * pixels;
  const h = FRAME_H * pixels;
  return ROWS.flatMap((facing, row) =>
    Array.from({ length: STEPS }, (_, step) => ({
      name: frameName(facing, step),
      x: Math.round(step * w),
      y: Math.round(row * h),
      w: Math.floor(w),
      h: Math.floor(h),
    })),
  );
}

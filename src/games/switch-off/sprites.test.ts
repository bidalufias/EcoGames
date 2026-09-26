import { describe, expect, it } from 'vitest';
import { FAMILY, PLAYER } from '../../content/energy';
import { FRAME_H, FRAME_W, LOOKS, STEPS, frameName, sheetFrames } from './sprites';

describe('walking sprites', () => {
  it('has a look for everyone in the house', () => {
    for (const m of [...FAMILY, PLAYER]) expect(LOOKS[m.name], m.name).toBeDefined();
  });

  it('lays out a frame for each way to face and each step, without overlaps', () => {
    const frames = sheetFrames(5);
    expect(frames).toHaveLength(3 * STEPS);
    expect(new Set(frames.map((f) => f.name)).size).toBe(frames.length);
    for (const facing of ['down', 'up', 'side'] as const)
      for (let step = 0; step < STEPS; step++) {
        expect(frames.some((f) => f.name === frameName(facing, step))).toBe(true);
      }
    for (const f of frames) {
      expect(f.w).toBe(FRAME_W * 5);
      expect(f.h).toBe(FRAME_H * 5);
      expect(f.x % f.w).toBe(0);
      expect(f.y % f.h).toBe(0);
    }
  });
});

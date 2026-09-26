import { describe, expect, it } from 'vitest';
import { imageUrl } from '../ui/images';
import { APPLIANCES, ENERGY_TIPS, FAMILY, PLAYER, ROOMS } from './energy';

// Guards the Switch Off! content rules (see docs/CONTENT.md).

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('energy content', () => {
  it('has unique ids', () => {
    expect(unique(ROOMS.map((r) => r.id))).toBe(true);
    expect(unique(APPLIANCES.map((a) => a.id))).toBe(true);
    expect(unique([...FAMILY, PLAYER].map((f) => f.name))).toBe(true);
  });

  it('only references images that exist', () => {
    for (const a of APPLIANCES) expect(imageUrl(a.image), a.id).toBeTruthy();
  });

  it('puts two or three appliances in every room, and nowhere else', () => {
    const roomIds = new Set(ROOMS.map((r) => r.id));
    for (const a of APPLIANCES) expect(roomIds.has(a.room), a.id).toBe(true);
    for (const r of ROOMS) {
      const count = APPLIANCES.filter((a) => a.room === r.id).length;
      expect(count, r.id).toBeGreaterThanOrEqual(2);
      expect(count, r.id).toBeLessThanOrEqual(3);
    }
  });

  it('keeps tips short, full sentences', () => {
    const tips = [...APPLIANCES.map((a) => a.tip), ...ENERGY_TIPS.map((t) => t.detail)];
    for (const tip of tips) {
      expect(tip.length, tip).toBeLessThanOrEqual(110);
      expect(tip.endsWith('.'), tip).toBe(true);
    }
  });

  it('has short room names for phones', () => {
    for (const r of ROOMS) expect(r.shortName.length, r.id).toBeLessThanOrEqual(8);
  });
});

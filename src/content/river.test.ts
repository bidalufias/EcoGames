import { describe, expect, it } from 'vitest';
import { imageUrl } from '../ui/images';
import { RIVER_FACTS, RIVER_ITEMS } from './river';

// Guards the River Rescue content against the rules in docs/CONTENT.md.

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('river content', () => {
  it('has unique ids', () => {
    expect(unique(RIVER_ITEMS.map((i) => i.id))).toBe(true);
    expect(unique(RIVER_FACTS.map((f) => f.id))).toBe(true);
  });

  it('only references images that exist', () => {
    for (const i of RIVER_ITEMS) expect(imageUrl(i.image), i.id).toBeTruthy();
  });

  it('has several rubbish items and animals', () => {
    expect(RIVER_ITEMS.filter((i) => i.kind === 'rubbish').length).toBeGreaterThanOrEqual(4);
    expect(RIVER_ITEMS.filter((i) => i.kind === 'animal').length).toBeGreaterThanOrEqual(3);
  });

  it('keeps facts short enough for toasts', () => {
    const texts = [
      ...RIVER_ITEMS.map((i) => ({ id: i.id, text: i.fact })),
      ...RIVER_FACTS.map((f) => ({ id: f.id, text: f.detail })),
    ];
    for (const { id, text } of texts) {
      expect(text.length, id).toBeLessThanOrEqual(110);
      expect(text.endsWith('.'), id).toBe(true);
    }
    for (const f of RIVER_FACTS) expect(f.term.length, f.id).toBeLessThanOrEqual(18);
  });
});

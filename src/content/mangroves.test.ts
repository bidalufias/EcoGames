import { describe, expect, it } from 'vitest';
import { IMAGE_NAMES } from '../ui/images';
import {
  MANGROVE_FACTS,
  MANGROVE_RUBBISH,
  MANGROVE_SPECIES,
  NURSERY_ANIMALS,
  RUBBISH_FACT,
} from './mangroves';

// Guards the content rules in docs/CONTENT.md for Mangrove Guard.

describe('mangrove content', () => {
  it('uses images that exist', () => {
    const images = new Set<string>(IMAGE_NAMES);
    for (const name of [...MANGROVE_RUBBISH, ...NURSERY_ANIMALS]) {
      expect(images.has(name), name).toBe(true);
    }
  });

  it('has unique facts that fit the results', () => {
    expect(MANGROVE_FACTS.length).toBeGreaterThanOrEqual(6);
    const all = [
      ...MANGROVE_FACTS,
      RUBBISH_FACT,
      ...Object.values(MANGROVE_SPECIES).map((s) => ({ id: s.id, term: s.name, detail: s.fact })),
    ];
    expect(new Set(all.map((f) => f.id)).size).toBe(all.length);
    for (const f of all) {
      expect(f.term.length, f.id).toBeLessThanOrEqual(18);
      expect(f.detail.length, f.id).toBeLessThanOrEqual(110);
      expect(f.detail.endsWith('.'), f.id).toBe(true);
    }
  });

  it('keeps the planting buttons short', () => {
    for (const s of Object.values(MANGROVE_SPECIES))
      expect(s.tag.length, s.id).toBeLessThanOrEqual(20);
  });
});

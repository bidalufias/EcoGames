import { describe, expect, it } from 'vitest';
import { imageUrl } from '../ui/images';
import { FOREST_STAGES } from './forest';

// Guards the content rules in docs/CONTENT.md for Grow the Forest.

describe('forest stages', () => {
  it('has unique ids and names, in stage order', () => {
    expect(new Set(FOREST_STAGES.map((s) => s.id)).size).toBe(FOREST_STAGES.length);
    expect(new Set(FOREST_STAGES.map((s) => s.name)).size).toBe(FOREST_STAGES.length);
    FOREST_STAGES.forEach((s, i) => expect(s.stage, s.id).toBe(i + 1));
  });

  it('only references images that exist', () => {
    for (const s of FOREST_STAGES) expect(imageUrl(s.image), s.id).toBeTruthy();
  });

  it('keeps text short enough for tiles, toasts and the results', () => {
    for (const s of FOREST_STAGES) {
      expect(s.name.length, s.id).toBeLessThanOrEqual(18);
      expect(s.fact.length, s.id).toBeLessThanOrEqual(110);
      expect(s.fact.endsWith('.'), s.id).toBe(true);
    }
  });
});

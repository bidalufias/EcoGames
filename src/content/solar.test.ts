import { describe, expect, it } from 'vitest';
import { SOLAR_FACTS } from './solar';

// Guards the content rules in docs/CONTENT.md for Solar Link's facts.

describe('solar facts', () => {
  it('has six to eight facts with unique ids', () => {
    expect(SOLAR_FACTS.length).toBeGreaterThanOrEqual(6);
    expect(SOLAR_FACTS.length).toBeLessThanOrEqual(8);
    expect(new Set(SOLAR_FACTS.map((f) => f.id)).size).toBe(SOLAR_FACTS.length);
  });

  it('keeps fact text short enough for the results dialog', () => {
    for (const f of SOLAR_FACTS) {
      expect(f.term.length, f.id).toBeLessThanOrEqual(18);
      expect(f.detail.length, f.id).toBeLessThanOrEqual(110);
      expect(f.detail.endsWith('.'), f.id).toBe(true);
    }
  });
});

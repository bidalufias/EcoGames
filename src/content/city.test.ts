import { describe, expect, it } from 'vitest';
import { IMAGE_NAMES } from '../ui/images';
import { BUILDINGS, CITY_FACT } from './city';

// Guards the content rules in docs/CONTENT.md for Green City.

describe('green city buildings', () => {
  const buildings = Object.entries(BUILDINGS);

  it('keys each building by its kind, with a known image', () => {
    const images = new Set<string>(IMAGE_NAMES);
    for (const [kind, b] of buildings) {
      expect(b.kind).toBe(kind);
      expect(images.has(b.image), kind).toBe(true);
    }
    expect(new Set(buildings.map(([, b]) => b.image)).size).toBe(buildings.length);
  });

  it('keeps rules short enough for a card on a phone', () => {
    for (const [kind, b] of buildings) {
      expect(b.rule.length, kind).toBeLessThanOrEqual(60);
      expect(b.name.length, kind).toBeLessThanOrEqual(14);
    }
  });

  it('keeps facts short enough for the results', () => {
    for (const { term, detail } of [
      ...buildings.map(([, b]) => ({ term: b.name, detail: b.fact })),
      CITY_FACT,
    ]) {
      expect(term.length, term).toBeLessThanOrEqual(18);
      expect(detail.length, term).toBeLessThanOrEqual(110);
      expect(detail.endsWith('.'), term).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { imageUrl } from '../ui/images';
import { BEACH_LIGHT, BEACH_RUBBISH, GHOST_CRAB, TURTLE_FACTS } from './turtles';

// Guards the content rules in docs/CONTENT.md for Turtle Trek.

const things = [...BEACH_RUBBISH, GHOST_CRAB, BEACH_LIGHT];

describe('turtle content', () => {
  it('has unique ids', () => {
    expect(new Set(things.map((t) => t.id)).size).toBe(things.length);
    expect(new Set(TURTLE_FACTS.map((f) => f.id)).size).toBe(TURTLE_FACTS.length);
  });

  it('only references images that exist', () => {
    for (const t of things) expect(imageUrl(t.image), t.id).toBeTruthy();
  });

  it('keeps text short enough for toasts and the results', () => {
    for (const t of things) {
      expect(t.fact.length, t.id).toBeLessThanOrEqual(110);
      expect(t.fact.endsWith('.'), t.id).toBe(true);
    }
    expect(TURTLE_FACTS.length).toBeGreaterThanOrEqual(6);
    for (const f of TURTLE_FACTS) {
      expect(f.term.length, f.id).toBeLessThanOrEqual(18);
      expect(f.detail.length, f.id).toBeLessThanOrEqual(110);
      expect(f.detail.endsWith('.'), f.id).toBe(true);
    }
  });
});

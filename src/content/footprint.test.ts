import { describe, expect, it } from 'vitest';
import { IMAGE_NAMES } from '../ui/images';
import { CHOICE_PAIRS, TOPIC_LABELS, type ChoiceTopic } from './footprint';

// Guards the content rules in docs/CONTENT.md for Greener Choice.

describe('greener choice pairs', () => {
  it('has unique ids and enough pairs in every topic for a mixed round', () => {
    expect(new Set(CHOICE_PAIRS.map((p) => p.id)).size).toBe(CHOICE_PAIRS.length);
    for (const topic of Object.keys(TOPIC_LABELS) as ChoiceTopic[]) {
      expect(CHOICE_PAIRS.filter((p) => p.topic === topic).length, topic).toBeGreaterThanOrEqual(5);
    }
  });

  it('shows two different pictures and names that fit on a card', () => {
    const images = new Set<string>(IMAGE_NAMES);
    for (const p of CHOICE_PAIRS) {
      expect(p.greener.image, p.id).not.toBe(p.other.image);
      expect(p.greener.name, p.id).not.toBe(p.other.name);
      for (const c of [p.greener, p.other]) {
        expect(images.has(c.image), `${p.id}: ${c.image}`).toBe(true);
        expect(c.name.length, `${p.id}: ${c.name}`).toBeLessThanOrEqual(28);
      }
    }
  });

  it('explains each answer in one short sentence', () => {
    for (const p of CHOICE_PAIRS) {
      expect(p.why.length, p.id).toBeLessThanOrEqual(110);
      expect(p.why.endsWith('.'), p.id).toBe(true);
    }
  });
});

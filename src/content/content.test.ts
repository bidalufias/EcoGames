import { describe, expect, it } from 'vitest';
import { hasIcon } from '../ui/icons';
import { IMAGE_FILES, IMAGE_NAMES, imageUrl } from '../ui/images';
import { CONCEPTS } from './concepts';
import { QUESTIONS, QUIZ_TOPICS } from './quiz';
import { WASTE_ITEMS } from './waste';

// Guards the content rules in docs/CONTENT.md so edits can't silently break games.

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('content', () => {
  it('has unique ids everywhere', () => {
    expect(unique(CONCEPTS.map((c) => c.id))).toBe(true);
    expect(unique(QUESTIONS.map((q) => q.id))).toBe(true);
    expect(unique(WASTE_ITEMS.map((w) => w.id))).toBe(true);
  });

  it('only references images that exist', () => {
    for (const c of CONCEPTS) expect(imageUrl(c.image), c.id).toBeTruthy();
    for (const w of WASTE_ITEMS) expect(imageUrl(w.image), w.id).toBeTruthy();
  });

  it('lists exactly the image files in src/assets/3d', () => {
    const files = Object.keys(IMAGE_FILES).map((p) => p.replace(/^.*\/(.+)\.webp$/, '$1'));
    expect([...files].sort()).toEqual([...IMAGE_NAMES].sort());
  });

  it('keeps concept text short enough for cards and toasts', () => {
    for (const c of CONCEPTS) {
      expect(c.term.length, c.id).toBeLessThanOrEqual(18);
      expect(c.detail.length, c.id).toBeLessThanOrEqual(110);
      expect(c.detail.endsWith('.'), c.id).toBe(true);
    }
  });

  it('has well-formed quiz questions', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(20);
    for (const q of QUESTIONS) {
      expect(q.options, q.id).toHaveLength(4);
      expect(unique([...q.options]), q.id).toBe(true);
      expect(q.options[q.answer], q.id).toBeTruthy();
      expect(q.explain.length, q.id).toBeGreaterThan(20);
    }
  });

  it('gives every quiz topic enough questions for its own round', () => {
    for (const t of QUIZ_TOPICS) {
      expect(hasIcon(t.icon), t.id).toBe(true);
      expect(QUESTIONS.filter((q) => q.topic === t.id).length, t.id).toBeGreaterThanOrEqual(8);
    }
    expect(QUESTIONS.every((q) => QUIZ_TOPICS.some((t) => t.id === q.topic))).toBe(true);
  });

  it('spreads correct quiz answers across positions in the source data', () => {
    // Options are shuffled at runtime, so this is only a sanity check on authoring.
    expect(QUESTIONS.some((q) => q.answer !== 0)).toBe(true);
  });
});

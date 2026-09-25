import { describe, expect, it } from 'vitest';
import { hasIcon } from '../ui/icons';
import { CONCEPTS } from './concepts';
import { QUESTIONS } from './quiz';
import { WASTE_ITEMS } from './waste';

// Guards the content rules in docs/CONTENT.md so edits can't silently break games.

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('content', () => {
  it('has unique ids everywhere', () => {
    expect(unique(CONCEPTS.map((c) => c.id))).toBe(true);
    expect(unique(QUESTIONS.map((q) => q.id))).toBe(true);
    expect(unique(WASTE_ITEMS.map((w) => w.id))).toBe(true);
  });

  it('only references icons that exist', () => {
    for (const c of CONCEPTS) expect(hasIcon(c.icon), c.id).toBe(true);
    for (const w of WASTE_ITEMS) expect(hasIcon(w.icon), w.id).toBe(true);
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

  it('spreads correct quiz answers across positions in the source data', () => {
    // Options are shuffled at runtime, so this is only a sanity check on authoring.
    expect(QUESTIONS.some((q) => q.answer !== 0)).toBe(true);
  });
});

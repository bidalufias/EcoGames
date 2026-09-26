import { describe, expect, it } from 'vitest';
import { ECO_WORDS } from './words';

// Guards the content rules in docs/CONTENT.md for Eco Word.

describe('eco words', () => {
  it('has plenty of unique five-letter words', () => {
    expect(ECO_WORDS.length).toBeGreaterThanOrEqual(24);
    expect(new Set(ECO_WORDS.map((w) => w.word)).size).toBe(ECO_WORDS.length);
    for (const w of ECO_WORDS) expect(w.word).toMatch(/^[A-Z]{5}$/);
  });

  it('has clues that fit on one line and don’t give the word away', () => {
    for (const w of ECO_WORDS) {
      expect(w.clue.length, w.word).toBeLessThanOrEqual(60);
      expect(w.clue.toUpperCase(), w.word).not.toContain(w.word);
    }
  });

  it('keeps facts short enough for the results', () => {
    for (const w of ECO_WORDS) {
      expect(w.fact.length, w.word).toBeLessThanOrEqual(110);
      expect(w.fact.endsWith('.'), w.word).toBe(true);
    }
  });
});

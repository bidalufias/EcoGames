import { describe, expect, it } from 'vitest';
import { ECO_WORDS, type EcoWord } from '../../content/words';
import { seededRng } from '../../core/random';
import { GUESS_WORDS } from './dictionary';
import {
  CLUE_AFTER,
  MAX_GUESSES,
  WordGame,
  markGuess,
  pickWords,
  wordPoints,
  wordStars,
} from './logic';

const DICT = new Set(GUESS_WORDS.split(' ').map((w) => w.toUpperCase()));
const isWord = (w: string) => DICT.has(w);
const word = (w: string): EcoWord => ECO_WORDS.find((x) => x.word === w)!;

function guess(g: WordGame, w: string) {
  for (const l of w) g.type(l);
  return g.submit();
}

describe('markGuess', () => {
  it('marks letters in the right place, elsewhere, and missing', () => {
    expect(markGuess('SOLAR', 'SOLAR')).toEqual(Array(5).fill('correct'));
    expect(markGuess('LOSER', 'SOLAR')).toEqual([
      'present',
      'correct',
      'present',
      'absent',
      'correct',
    ]);
  });

  it('counts repeated letters only as often as the answer has them', () => {
    // GREEN has two Es; EERIE has three, so only two can score.
    expect(markGuess('EERIE', 'GREEN')).toEqual([
      'present',
      'present',
      'present',
      'absent',
      'absent',
    ]);
    // An exact match uses up the letter before any "elsewhere" mark.
    expect(markGuess('TREES', 'TIGER')).toEqual([
      'correct',
      'present',
      'absent',
      'correct',
      'absent',
    ]);
  });
});

describe('WordGame', () => {
  const words = [word('SOLAR'), word('OZONE'), word('TIGER')];

  it('types up to five letters, ignores anything else, and can delete', () => {
    const g = new WordGame(words, isWord, 'normal');
    for (const l of 'SO1LAR!X') g.type(l);
    expect(g.current).toBe('SOLAR');
    expect(g.back()).toBe(true);
    expect(g.current).toBe('SOLA');
    expect(g.submit()).toEqual({ kind: 'short' });
  });

  it('only accepts real words, and always accepts the answers', () => {
    const g = new WordGame(words, isWord, 'normal');
    expect(guess(g, 'ABCDE')).toEqual({ kind: 'unknown' });
    expect(g.guesses).toHaveLength(0);
    expect(g.current).toBe('ABCDE');
    g.current = '';
    expect(guess(g, 'PLANT')).toMatchObject({ kind: 'scored', solved: false });
    const answersOnly = new WordGame(words, () => false, 'normal');
    expect(guess(answersOnly, 'SOLAR')).toMatchObject({ kind: 'scored', solved: true });
  });

  it('scores a solved word by guesses, and moves to the next word', () => {
    const g = new WordGame(words, isWord, 'normal');
    guess(g, 'PLANT');
    const r = guess(g, 'SOLAR');
    expect(r).toMatchObject({ kind: 'scored', solved: true, points: wordPoints(2, false) });
    expect(g.done).toBe(true);
    expect(g.type('A')).toBe(false);
    expect(g.next()).toBe(true);
    expect(g.answer.word).toBe('OZONE');
    expect(g.guesses).toHaveLength(0);
    expect(g.score).toBe(wordPoints(2, false));
  });

  it('gives the word away after six misses', () => {
    const g = new WordGame(words, isWord, 'normal');
    let last;
    for (let i = 0; i < MAX_GUESSES; i++) last = guess(g, 'PLANT');
    expect(last).toMatchObject({ kind: 'scored', solved: false, failed: true, points: 0 });
    expect(g.done).toBe(true);
    expect(g.results[0]).toMatchObject({ solved: false, guesses: MAX_GUESSES });
  });

  it('shows the clue after three misses on Normal, and from the start on Easy', () => {
    const normal = new WordGame(words, isWord, 'normal');
    expect(normal.clueShown).toBe(false);
    for (let i = 0; i < CLUE_AFTER.normal; i++) guess(normal, 'PLANT');
    expect(normal.clueShown).toBe(true);
    guess(normal, 'SOLAR');
    expect(normal.results[0]).toMatchObject({ usedClue: true, points: wordPoints(4, true) });
    expect(new WordGame(words, isWord, 'easy').clueShown).toBe(true);
  });

  it('keeps the best mark for each letter for the keyboard', () => {
    const g = new WordGame(words, isWord, 'normal');
    guess(g, 'ROAST'); // R, O, A present; S present; T absent
    guess(g, 'SOLAR');
    const marks = g.letterMarks();
    expect(marks.get('S')).toBe('correct');
    expect(marks.get('T')).toBe('absent');
  });

  it('finishes after the last word', () => {
    const g = new WordGame(words, isWord, 'normal');
    for (const w of words) {
      guess(g, w.word);
      g.next();
    }
    expect(g.finished).toBe(true);
    expect(g.solvedCount).toBe(3);
    expect(g.totalGuesses).toBe(3);
    expect(g.next()).toBe(false);
  });
});

describe('scoring and picking', () => {
  it('gives more points for fewer guesses and no clue', () => {
    expect(wordPoints(1, false)).toBe(140);
    expect(wordPoints(6, true)).toBe(20);
  });

  it('gives stars for solving every word in few guesses', () => {
    expect(wordStars(3, 12)).toBe(3);
    expect(wordStars(3, 13)).toBe(2);
    expect(wordStars(1, 10)).toBe(1);
    expect(wordStars(0, 18)).toBe(0);
  });

  it('picks different words from the ones played recently', () => {
    const recent = ECO_WORDS.slice(0, 20).map((w) => w.word);
    const picked = pickWords(ECO_WORDS, seededRng(1), recent);
    expect(picked).toHaveLength(3);
    expect(new Set(picked.map((w) => w.word)).size).toBe(3);
    for (const w of picked) expect(recent).not.toContain(w.word);
  });

  it('only uses answers the guess list knows', () => {
    for (const w of ECO_WORDS) expect(isWord(w.word), w.word).toBe(true);
  });
});

import type { EcoWord } from '../../content/words';
import { shuffle, type Rng } from '../../core/random';

// Eco Word rules: guess a five-letter word in six tries. After each guess every letter
// is marked: in the right place, in the word but somewhere else, or not in the word.
// A round is three words; a clue appears from the start (Easy) or after three misses.

export type Mark = 'correct' | 'present' | 'absent';
export type Level = 'easy' | 'normal';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
export const WORDS_PER_ROUND = 3;
/** Wrong guesses before the clue appears. */
export const CLUE_AFTER: Record<Level, number> = { easy: 0, normal: 3 };

/** Marks each letter of a guess, counting repeated letters the way Wordle does. */
export function markGuess(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array.from({ length: guess.length }, () => 'absent');
  const left = new Map<string, number>();
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) marks[i] = 'correct';
    else left.set(answer[i]!, (left.get(answer[i]!) ?? 0) + 1);
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'correct') continue;
    const n = left.get(guess[i]!) ?? 0;
    if (n > 0) {
      marks[i] = 'present';
      left.set(guess[i]!, n - 1);
    }
  }
  return marks;
}

/** Points for a solved word: more for fewer guesses, plus a bonus without the clue. */
export function wordPoints(guesses: number, usedClue: boolean): number {
  return (MAX_GUESSES + 1 - guesses) * 20 + (usedClue ? 0 : 20);
}

/** Three stars for solving every word in 12 guesses or fewer (four each). */
export function wordStars(solved: number, guesses: number, words = WORDS_PER_ROUND): number {
  if (solved === words) return guesses <= words * 4 ? 3 : 2;
  return solved > 0 ? 1 : 0;
}

/** Picks the round's words, avoiding ones played recently where possible. */
export function pickWords(
  words: readonly EcoWord[],
  rng: Rng,
  recent: readonly string[] = [],
  count = WORDS_PER_ROUND,
): EcoWord[] {
  const fresh = words.filter((w) => !recent.includes(w.word));
  const pool = fresh.length >= count ? fresh : [...words];
  return shuffle(pool, rng).slice(0, count);
}

export type SubmitOutcome =
  | { kind: 'short' }
  | { kind: 'unknown' }
  | { kind: 'scored'; marks: Mark[]; solved: boolean; failed: boolean; points: number };

export interface WordResult {
  word: EcoWord;
  solved: boolean;
  guesses: number;
  usedClue: boolean;
  points: number;
}

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

export class WordGame {
  readonly words: readonly EcoWord[];
  readonly level: Level;
  /** Index of the word being guessed. */
  index = 0;
  /** Guesses for the current word, and their marks. */
  guesses: { word: string; marks: Mark[] }[] = [];
  /** The letters typed so far for the next guess. */
  current = '';
  readonly results: WordResult[] = [];
  private isWord: (word: string) => boolean;

  constructor(words: readonly EcoWord[], isWord: (word: string) => boolean, level: Level) {
    this.words = words;
    this.isWord = (w) => isWord(w) || words.some((x) => x.word === w);
    this.level = level;
  }

  get answer(): EcoWord {
    return this.words[this.index]!;
  }

  /** The current word is solved or out of guesses. */
  get done(): boolean {
    return this.results.length > this.index;
  }

  get finished(): boolean {
    return this.results.length === this.words.length;
  }

  get clueShown(): boolean {
    return this.done || this.guesses.length >= CLUE_AFTER[this.level];
  }

  get score(): number {
    return this.results.reduce((sum, r) => sum + r.points, 0);
  }

  get solvedCount(): number {
    return this.results.filter((r) => r.solved).length;
  }

  get totalGuesses(): number {
    return this.results.reduce((sum, r) => sum + r.guesses, 0);
  }

  type(letter: string): boolean {
    const l = letter.toUpperCase();
    if (this.done || this.current.length >= WORD_LENGTH || !/^[A-Z]$/.test(l)) return false;
    this.current += l;
    return true;
  }

  back(): boolean {
    if (this.done || this.current.length === 0) return false;
    this.current = this.current.slice(0, -1);
    return true;
  }

  submit(): SubmitOutcome {
    if (this.done || this.current.length < WORD_LENGTH) return { kind: 'short' };
    if (!this.isWord(this.current)) return { kind: 'unknown' };
    const usedClue = this.clueShown;
    const word = this.current;
    const marks = markGuess(word, this.answer.word);
    this.guesses.push({ word, marks });
    this.current = '';
    const solved = word === this.answer.word;
    const failed = !solved && this.guesses.length >= MAX_GUESSES;
    const points = solved ? wordPoints(this.guesses.length, usedClue) : 0;
    if (solved || failed) {
      this.results.push({
        word: this.answer,
        solved,
        guesses: this.guesses.length,
        usedClue,
        points,
      });
    }
    return { kind: 'scored', marks, solved, failed, points };
  }

  /** Moves on to the next word. Returns false at the end of the round. */
  next(): boolean {
    if (!this.done || this.index + 1 >= this.words.length) return false;
    this.index++;
    this.guesses = [];
    this.current = '';
    return true;
  }

  /** The best mark each letter has had for the current word, for the keyboard. */
  letterMarks(): Map<string, Mark> {
    const out = new Map<string, Mark>();
    for (const g of this.guesses) {
      [...g.word].forEach((l, i) => {
        const m = g.marks[i]!;
        const was = out.get(l);
        if (!was || RANK[m] > RANK[was]) out.set(l, m);
      });
    }
    return out;
  }
}

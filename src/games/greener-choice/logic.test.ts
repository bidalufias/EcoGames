import { describe, expect, it } from 'vitest';
import { CHOICE_PAIRS } from '../../content/footprint';
import { seededRng } from '../../core/random';
import {
  ANSWER_MS,
  CORRECT_POINTS,
  ChoiceRound,
  RECENT_SIZE,
  ROUND_SIZE,
  SPEED_POINTS,
  STREAK_CAP,
  STREAK_POINTS,
  answerPoints,
  choiceStars,
  nextRecent,
  pickPairs,
} from './logic';

function round(level: 'easy' | 'normal' = 'easy', seed = 1): ChoiceRound {
  return new ChoiceRound(
    pickPairs(CHOICE_PAIRS, ROUND_SIZE, seededRng(seed)),
    level,
    seededRng(seed),
  );
}

describe('pickPairs', () => {
  it('picks a round of different pairs that mixes the topics', () => {
    const picked = pickPairs(CHOICE_PAIRS, ROUND_SIZE, seededRng(4));
    expect(picked).toHaveLength(ROUND_SIZE);
    expect(new Set(picked.map((p) => p.id)).size).toBe(ROUND_SIZE);
    expect(new Set(picked.map((p) => p.topic)).size).toBe(4);
    // Dealt topic by topic, so the same topic never comes up twice in a row.
    for (let i = 1; i < 4; i++) expect(picked[i]!.topic).not.toBe(picked[i - 1]!.topic);
  });

  it('leaves out recently played pairs when it can', () => {
    const recent = CHOICE_PAIRS.slice(0, RECENT_SIZE).map((p) => p.id);
    const picked = pickPairs(CHOICE_PAIRS, ROUND_SIZE, seededRng(2), recent);
    expect(picked.some((p) => recent.includes(p.id))).toBe(false);
  });

  it('copes with asking for more pairs than there are', () => {
    const few = CHOICE_PAIRS.slice(0, 3);
    expect(pickPairs(few, ROUND_SIZE, seededRng(1))).toHaveLength(3);
  });
});

describe('ChoiceRound', () => {
  it('puts the greener choice on either side', () => {
    const sides = round('easy', 7).questions.map((q) => q.greenerSide);
    expect(sides).toContain(0);
    expect(sides).toContain(1);
  });

  it('scores right answers, builds a streak and resets it on a wrong one', () => {
    const r = round();
    const q0 = r.current!;
    expect(r.answer(q0.greenerSide)).toEqual({
      correct: true,
      points: CORRECT_POINTS,
      timedOut: false,
    });
    expect(r.answer(q0.greenerSide)).toBeNull();
    r.next();
    expect(r.answer(r.current!.greenerSide)!.points).toBe(CORRECT_POINTS + STREAK_POINTS);
    r.next();
    const wrong = r.current!.greenerSide === 0 ? 1 : 0;
    expect(r.answer(wrong)).toEqual({ correct: false, points: 0, timedOut: false });
    expect(r.streak).toBe(0);
    expect(r.bestStreak).toBe(2);
    expect(r.correct).toBe(2);
    expect(r.missed).toEqual([r.current!.pair.id]);
  });

  it('counts running out of time as a miss', () => {
    const r = round('normal');
    expect(r.timeout()).toEqual({ correct: false, points: 0, timedOut: true });
    expect(r.timeout()).toBeNull();
  });

  it('ends after the last question', () => {
    const r = round();
    let steps = 0;
    do {
      r.answer(r.current!.greenerSide);
      steps++;
    } while (r.next());
    expect(steps).toBe(ROUND_SIZE);
    expect(r.done).toBe(true);
    expect(r.correct).toBe(ROUND_SIZE);
    expect(r.current).toBeUndefined();
    expect(r.answer(0)).toBeNull();
  });

  it('does not move on before an answer', () => {
    const r = round();
    expect(r.next()).toBe(true);
    expect(r.index).toBe(0);
  });
});

describe('scoring', () => {
  it('caps the streak bonus and adds a speed bonus only on Normal', () => {
    expect(answerPoints(1, 'easy', ANSWER_MS)).toBe(CORRECT_POINTS);
    expect(answerPoints(50, 'easy', 0)).toBe(CORRECT_POINTS + STREAK_CAP * STREAK_POINTS);
    expect(answerPoints(1, 'normal', ANSWER_MS)).toBe(CORRECT_POINTS + SPEED_POINTS);
    expect(answerPoints(1, 'normal', ANSWER_MS / 2)).toBe(CORRECT_POINTS + SPEED_POINTS / 2);
    expect(answerPoints(1, 'normal', -5)).toBe(CORRECT_POINTS);
  });

  it('gives stars for the share of greener choices', () => {
    expect([0, 4, 5, 7, 8, 9, 10].map((n) => choiceStars(n))).toEqual([0, 0, 1, 2, 2, 3, 3]);
    expect(choiceStars(0, 0)).toBe(0);
  });

  it('keeps the latest pairs at the front of the recent list', () => {
    expect(nextRecent(['a', 'b'], ['c', 'a'])).toEqual(['c', 'a', 'b']);
    const many = Array.from({ length: 30 }, (_, i) => `p${i}`);
    expect(nextRecent([], many)).toHaveLength(RECENT_SIZE);
  });
});

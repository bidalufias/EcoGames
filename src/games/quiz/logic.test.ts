import { describe, expect, it } from 'vitest';
import { QUESTIONS, QUIZ_TOPICS } from '../../content/quiz';
import { seededRng } from '../../core/random';
import { QuizRound, ROUND_LENGTH, buildRound, pickQuestions, quizStars } from './logic';

describe('buildRound', () => {
  it('picks distinct questions and keeps the right answer after shuffling options', () => {
    const round = buildRound(QUESTIONS, ROUND_LENGTH, seededRng(7));
    expect(round).toHaveLength(ROUND_LENGTH);
    expect(new Set(round.map((q) => q.source.id)).size).toBe(ROUND_LENGTH);
    for (const q of round) {
      expect(q.options[q.correct]).toBe(q.source.options[q.source.answer]);
      expect([...q.options].sort()).toEqual([...q.source.options].sort());
    }
  });
});

describe('pickQuestions', () => {
  it('returns only the chosen topic', () => {
    const picked = pickQuestions(QUESTIONS, 'oceans', seededRng(3));
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.every((q) => q.topic === 'oceans')).toBe(true);
    expect(picked).toHaveLength(QUESTIONS.filter((q) => q.topic === 'oceans').length);
  });

  it('covers every topic once before repeating one when mixing all topics', () => {
    const picked = pickQuestions(QUESTIONS, 'all', seededRng(4));
    expect(picked).toHaveLength(QUESTIONS.length);
    const first = picked.slice(0, QUIZ_TOPICS.length).map((q) => q.topic);
    expect(new Set(first).size).toBe(QUIZ_TOPICS.length);
  });

  it('varies the order between rounds', () => {
    const a = pickQuestions(QUESTIONS, 'all', seededRng(1)).map((q) => q.id);
    const b = pickQuestions(QUESTIONS, 'all', seededRng(2)).map((q) => q.id);
    expect(a).not.toEqual(b);
  });
});

describe('QuizRound', () => {
  it('scores correct answers with a growing streak bonus', () => {
    const round = new QuizRound(buildRound(QUESTIONS, 3, seededRng(8)));
    const first = round.answer(round.current!.correct);
    expect(first).toMatchObject({ correct: true, points: 100, streak: 1 });
    round.next();
    const second = round.answer(round.current!.correct);
    expect(second?.points).toBe(125);
    round.next();
    const third = round.answer((round.current!.correct + 1) % 4);
    expect(third).toMatchObject({ correct: false, points: 0, streak: 0 });
    expect(round.score).toBe(225);
    expect(round.correctCount).toBe(2);
    expect(round.missed).toHaveLength(1);
    expect(round.bestStreak).toBe(2);
    expect(round.next()).toBe(false);
  });

  it('ignores a second answer to the same question', () => {
    const round = new QuizRound(buildRound(QUESTIONS, 2, seededRng(9)));
    round.answer(0);
    expect(round.answer(1)).toBeNull();
  });
});

describe('quizStars', () => {
  it('maps accuracy to stars', () => {
    expect(quizStars(10, 10)).toBe(3);
    expect(quizStars(7, 10)).toBe(2);
    expect(quizStars(3, 10)).toBe(1);
    expect(quizStars(0, 10)).toBe(0);
  });
});

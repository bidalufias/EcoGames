import type { QuizQuestion } from '../../content/quiz';
import { sample, shuffle, type Rng } from '../../core/random';

export const ROUND_LENGTH = 10;
const BASE_POINTS = 100;
const STREAK_BONUS = 25;
const MAX_STREAK_BONUS = 4;

/** A question with its options shuffled for this round. */
export interface RoundQuestion {
  source: QuizQuestion;
  options: string[];
  correct: number;
}

export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  points: number;
  streak: number;
}

export function buildRound(
  questions: readonly QuizQuestion[],
  count = ROUND_LENGTH,
  rng: Rng = Math.random,
): RoundQuestion[] {
  return sample(questions, count, rng).map((q) => {
    const order = shuffle([0, 1, 2, 3], rng);
    return {
      source: q,
      options: order.map((i) => q.options[i] as string),
      correct: order.indexOf(q.answer),
    };
  });
}

export class QuizRound {
  readonly questions: RoundQuestion[];
  index = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  readonly missed: RoundQuestion[] = [];
  private answered = false;

  constructor(questions: RoundQuestion[]) {
    this.questions = questions;
  }

  get current(): RoundQuestion | undefined {
    return this.questions[this.index];
  }

  get correctCount(): number {
    return this.index + (this.answered ? 1 : 0) - this.missed.length;
  }

  get isAnswered(): boolean {
    return this.answered;
  }

  get isLast(): boolean {
    return this.index === this.questions.length - 1;
  }

  answer(choice: number): AnswerResult | null {
    const q = this.current;
    if (!q || this.answered) return null;
    this.answered = true;
    const correct = choice === q.correct;
    let points = 0;
    if (correct) {
      points = BASE_POINTS + Math.min(this.streak, MAX_STREAK_BONUS) * STREAK_BONUS;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.score += points;
    } else {
      this.streak = 0;
      this.missed.push(q);
    }
    return { correct, correctIndex: q.correct, points, streak: this.streak };
  }

  /** Moves to the next question. Returns false when the round is over. */
  next(): boolean {
    if (!this.answered) return true;
    this.answered = false;
    this.index++;
    return this.index < this.questions.length;
  }
}

export function quizStars(correct: number, total: number): number {
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  if (ratio > 0) return 1;
  return 0;
}

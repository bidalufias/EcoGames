import type { ChoicePair, ChoiceTopic } from '../../content/footprint';
import { shuffle, type Rng } from '../../core/random';

export type Level = 'easy' | 'normal';
/** 0 is the left (or top) card, 1 the right (or bottom) one. */
export type Side = 0 | 1;

export const ROUND_SIZE = 10;
/** Time to answer each pair on Normal. Easy has no timer. */
export const ANSWER_MS = 10_000;
export const CORRECT_POINTS = 100;
/** Extra points for each answer in a row after the first, up to STREAK_CAP. */
export const STREAK_POINTS = 20;
export const STREAK_CAP = 5;
/** Most points a quick answer can add on Normal. */
export const SPEED_POINTS = 50;
/** How many recently played pairs to keep out of the next round. */
export const RECENT_SIZE = 12;

export interface Question {
  pair: ChoicePair;
  /** Which side the greener choice is shown on. */
  greenerSide: Side;
}

export interface AnswerResult {
  correct: boolean;
  points: number;
  /** True when the time ran out before an answer. */
  timedOut: boolean;
}

/**
 * Picks a round of pairs, mixing the topics and leaving out recently played pairs
 * when there are enough others.
 */
export function pickPairs(
  pairs: readonly ChoicePair[],
  count: number,
  rng: Rng,
  recent: readonly string[] = [],
): ChoicePair[] {
  const seen = new Set(recent);
  const limit = Math.min(count, pairs.length);
  const out: ChoicePair[] = [];
  // Fresh pairs first, then recent ones only if the round still needs more.
  for (const group of [pairs.filter((p) => !seen.has(p.id)), pairs.filter((p) => seen.has(p.id))]) {
    // Deal the pairs out topic by topic, so a round never dwells on one topic.
    const byTopic = new Map<ChoiceTopic, ChoicePair[]>();
    for (const p of shuffle(group, rng)) byTopic.set(p.topic, [...(byTopic.get(p.topic) ?? []), p]);
    const topics = shuffle([...byTopic.keys()], rng);
    let left = group.length;
    while (out.length < limit && left > 0) {
      for (const t of topics) {
        const next = byTopic.get(t)?.shift();
        if (!next) continue;
        left--;
        if (out.length < limit) out.push(next);
      }
    }
  }
  return out;
}

/** Points for a correct answer: base, plus a streak bonus, plus a speed bonus on Normal. */
export function answerPoints(streak: number, level: Level, msLeft: number): number {
  const streakBonus = Math.min(Math.max(streak - 1, 0), STREAK_CAP) * STREAK_POINTS;
  const speed =
    level === 'normal' ? Math.round((SPEED_POINTS * Math.max(0, msLeft)) / ANSWER_MS) : 0;
  return CORRECT_POINTS + streakBonus + speed;
}

/** One round of Greener Choice: a list of pairs answered in order. */
export class ChoiceRound {
  readonly questions: Question[];
  index = 0;
  score = 0;
  correct = 0;
  streak = 0;
  bestStreak = 0;
  /** Set once the current question is answered, until `next()`. */
  answered: AnswerResult | null = null;
  /** Ids of the pairs answered wrongly, for the results. */
  readonly missed: string[] = [];

  constructor(
    pairs: readonly ChoicePair[],
    readonly level: Level,
    rng: Rng,
  ) {
    this.questions = pairs.map((pair) => ({ pair, greenerSide: rng() < 0.5 ? 0 : 1 }));
  }

  get current(): Question | undefined {
    return this.questions[this.index];
  }

  get total(): number {
    return this.questions.length;
  }

  get done(): boolean {
    return this.index >= this.questions.length;
  }

  /** Answers the current question. Returns null if it was already answered. */
  answer(side: Side, msLeft = ANSWER_MS): AnswerResult | null {
    const q = this.current;
    if (!q || this.answered) return null;
    const correct = side === q.greenerSide;
    return this.settle(correct, msLeft, false);
  }

  /** The timer ran out: counts as a wrong answer. */
  timeout(): AnswerResult | null {
    if (!this.current || this.answered) return null;
    return this.settle(false, 0, true);
  }

  /** Moves on to the next question. Returns false if the round is over. */
  next(): boolean {
    if (!this.answered) return !this.done;
    this.answered = null;
    this.index++;
    return !this.done;
  }

  private settle(correct: boolean, msLeft: number, timedOut: boolean): AnswerResult {
    let points = 0;
    if (correct) {
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.correct++;
      points = answerPoints(this.streak, this.level, msLeft);
      this.score += points;
    } else {
      this.streak = 0;
      this.missed.push(this.current!.pair.id);
    }
    this.answered = { correct, points, timedOut };
    return this.answered;
  }
}

/** Stars for the number of greener choices picked out of the round. */
export function choiceStars(correct: number, total = ROUND_SIZE): number {
  const share = total > 0 ? correct / total : 0;
  if (share >= 0.9) return 3;
  if (share >= 0.7) return 2;
  if (share >= 0.5) return 1;
  return 0;
}

/** The recent list after a round: this round's pairs first, trimmed to RECENT_SIZE. */
export function nextRecent(recent: readonly string[], played: readonly string[]): string[] {
  const out = [...played, ...recent.filter((id) => !played.includes(id))];
  return out.slice(0, RECENT_SIZE);
}

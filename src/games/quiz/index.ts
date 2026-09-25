import { QUESTIONS } from '../../content/quiz';
import { h, replace } from '../../core/dom';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { QuizRound, buildRound, quizStars } from './logic';
import './quiz.css';

const LETTERS = ['A', 'B', 'C', 'D'];

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  let round: QuizRound;

  const progressBar = h('div', { class: 'quiz-progress__bar' });
  const progress = h(
    'div',
    {
      class: 'quiz-progress',
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-label': 'Quiz progress',
    },
    progressBar,
  );
  const stats = h('div', { class: 'quiz-stats' });
  const card = h('section', { class: 'quiz-card', 'aria-live': 'off' });

  host.replaceChildren(
    h('div', { class: 'quiz' }, h('div', { class: 'quiz-top' }, stats, progress), card),
  );

  function renderStats(): void {
    replace(
      stats,
      h('span', { class: 'stat' }, `Question ${round.index + 1} of ${round.questions.length}`),
      h('span', { class: 'stat' }, icon('star', { size: 16 }), `${round.score} pts`),
      round.streak >= 2 &&
        h(
          'span',
          { class: 'stat quiz-streak' },
          icon('flame', { size: 16 }),
          `${round.streak} in a row`,
        ),
    );
    const total = round.questions.length;
    const done = round.index + (round.isAnswered ? 1 : 0);
    progress.setAttribute('aria-valuemax', String(total));
    progress.setAttribute('aria-valuenow', String(done));
    progressBar.style.width = `${(done / total) * 100}%`;
  }

  function renderQuestion(): void {
    const q = round.current;
    if (!q) return;
    const options = h('div', { class: 'quiz-options' });
    q.options.forEach((text, i) => {
      options.appendChild(
        h(
          'button',
          { class: 'quiz-option', type: 'button', 'data-index': i, onclick: () => choose(i) },
          h('span', { class: 'quiz-option__key', 'aria-hidden': 'true' }, LETTERS[i]),
          h('span', { class: 'quiz-option__text' }, text),
        ),
      );
    });
    card.replaceChildren(
      h('span', { class: 'quiz-topic' }, q.source.topic),
      h('h2', { class: 'quiz-question', tabindex: '-1' }, q.source.question),
      options,
      h('div', { class: 'quiz-feedback', hidden: true }),
    );
    renderStats();
    card.querySelector<HTMLElement>('.quiz-question')?.focus({ preventScroll: true });
  }

  function choose(choice: number): void {
    const result = round.answer(choice);
    if (!result) return;
    const buttons = card.querySelectorAll<HTMLButtonElement>('.quiz-option');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === result.correctIndex) btn.classList.add('is-correct');
      else if (i === choice) btn.classList.add('is-wrong');
    });
    ctx.sound(result.correct ? 'good' : 'bad');

    const q = round.current!;
    const feedback = card.querySelector<HTMLElement>('.quiz-feedback')!;
    const nextBtn = h(
      'button',
      { class: 'btn btn--primary', type: 'button', onclick: next },
      round.isLast ? 'See results' : 'Next question',
      icon('arrowRight', { size: 18 }),
    );
    feedback.className = `quiz-feedback ${result.correct ? 'is-correct' : 'is-wrong'}`;
    feedback.replaceChildren(
      h(
        'p',
        { class: 'quiz-feedback__title' },
        icon(result.correct ? 'check' : 'x', { size: 20, strokeWidth: 3 }),
        result.correct
          ? `Correct! +${result.points}`
          : `Not quite. The answer is: ${q.options[q.correct]}`,
      ),
      h('p', {}, q.source.explain),
      nextBtn,
    );
    feedback.hidden = false;
    ctx.announce(`${result.correct ? 'Correct.' : 'Not quite.'} ${q.source.explain}`);
    renderStats();
    nextBtn.focus({ preventScroll: true });
    feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function next(): void {
    ctx.sound('tap');
    if (round.next()) {
      renderQuestion();
    } else {
      finish();
    }
  }

  function finish(): void {
    const total = round.questions.length;
    const correct = round.correctCount;
    ctx.sound('win');
    ctx.showResult({
      title:
        correct === total ? 'Perfect score!' : correct >= total * 0.6 ? 'Great work!' : 'Nice try!',
      score: round.score,
      stars: quizStars(correct, total),
      isBest: ctx.submitScore(round.score),
      stats: [`${correct}/${total} correct`, `Best streak: ${round.bestStreak}`],
      learned: round.missed.map((q) => ({
        term: q.options[q.correct] as string,
        detail: q.source.explain,
      })),
      onReplay: start,
    });
  }

  function onKey(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement || document.querySelector('dialog[open]')) return;
    const n = ['1', '2', '3', '4'].indexOf(e.key);
    const letter = LETTERS.indexOf(e.key.toUpperCase());
    const choice = n >= 0 ? n : letter;
    if (choice >= 0 && !round.isAnswered) choose(choice);
  }

  function start(): void {
    round = new QuizRound(buildRound(QUESTIONS));
    renderQuestion();
  }

  document.addEventListener('keydown', onKey);
  start();

  return {
    destroy() {
      document.removeEventListener('keydown', onKey);
      host.replaceChildren();
    },
  };
}

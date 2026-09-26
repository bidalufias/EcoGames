import { CHOICE_PAIRS, TOPIC_LABELS, type Choice } from '../../content/footprint';
import { h, haptic, isCompact, replace } from '../../core/dom';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { image } from '../../ui/images';
import { renderIntro } from '../../ui/intro';
import {
  ANSWER_MS,
  ChoiceRound,
  ROUND_SIZE,
  choiceStars,
  nextRecent,
  pickPairs,
  type AnswerResult,
  type Level,
  type Side,
} from './logic';
import './greener-choice.css';

const LEVEL_KEY = 'choice-level';
const RECENT_KEY = 'choice-recent';
const LEVELS: Level[] = ['easy', 'normal'];
const LEVEL_LABELS: Record<Level, string> = { easy: 'Relaxed', normal: 'Against the clock' };
const KEY_SIDES: Record<string, Side> = { '1': 0, '2': 1, ArrowLeft: 0, ArrowRight: 1 };

function levelPicker(selected: Level, onChange: (level: Level) => void): HTMLElement {
  const group = h('fieldset', { class: 'segmented' }, h('legend', {}, 'Timer'));
  for (const level of LEVELS) {
    const input = h('input', {
      type: 'radio',
      name: 'choice-level',
      value: level,
      checked: level === selected,
    });
    input.addEventListener('change', () => onChange(level));
    group.appendChild(h('label', {}, input, h('span', {}, LEVEL_LABELS[level])));
  }
  return h(
    'div',
    { class: 'intro-options' },
    h('div', { class: 'intro-option' }, h('span', {}, 'Timer'), group),
  );
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const saved = readJSON<string>(LEVEL_KEY, 'easy');
  let level: Level = LEVELS.includes(saved as Level) ? (saved as Level) : 'easy';
  let round: ChoiceRound | null = null;
  const compact = isCompact();
  // End-to-end tests can see which card is greener (?e2e); never used in normal play.
  const e2e = new URLSearchParams(window.location.search).has('e2e');

  // Timer (Against the clock): time used on the current pair, counted in animation frames
  // so it pauses while the tab is hidden.
  let elapsed = 0;
  let lastFrame = 0;
  let frame = 0;

  const progressBar = h('div', { class: 'choice-progress__bar' });
  const progress = h(
    'div',
    { class: 'choice-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-label': 'Progress' },
    progressBar,
  );
  const topic = h('span', { class: 'choice-topic' });
  const prompt = h(
    'h2',
    { class: 'choice-prompt', tabindex: '-1' },
    'Which is the greener choice?',
  );
  const timerBar = h('div', { class: 'choice-timer__bar' });
  const timer = h('div', { class: 'choice-timer', 'aria-hidden': 'true' }, timerBar);
  const cards = h('div', { class: 'choice-cards' });
  const feedback = h('div', { class: 'choice-feedback', hidden: true });
  const stats = h('div', { class: 'choice-stats' });

  const intro = renderIntro(ctx.game, {
    options: levelPicker(level, (l) => {
      level = l;
      writeJSON(LEVEL_KEY, l);
    }),
    onStart: () => {
      ctx.sound('tap');
      start();
    },
  });

  const settings = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change timer' },
    icon('grid', { size: 18 }),
  );
  settings.addEventListener('click', () => showIntro());

  host.replaceChildren(
    h(
      'div',
      { class: 'choice' },
      progress,
      h('div', { class: 'choice-head' }, topic, prompt, timer),
      cards,
      feedback,
      intro,
    ),
  );
  ctx.hud.replaceChildren(...(compact ? [stats] : [stats, settings]));

  function renderStats(): void {
    if (!round) return;
    const n = Math.min(round.index + 1, round.total);
    replace(
      stats,
      h(
        'span',
        { class: 'stat choice-count' },
        h('span', { class: 'stat__label' }, 'Pair '),
        `${n}/${round.total}`,
      ),
      h('span', { class: 'stat' }, icon('star', { size: 14 }), `${round.score} pts`),
      round.streak >= 2 &&
        h(
          'span',
          { class: 'stat choice-streak' },
          icon('flame', { size: 14 }),
          `${round.streak}`,
          h('span', { class: 'stat__label' }, ' in a row'),
        ),
    );
    const done = round.index + (round.answered ? 1 : 0);
    progress.setAttribute('aria-valuemax', String(round.total));
    progress.setAttribute('aria-valuenow', String(done));
    progressBar.style.width = `${(done / round.total) * 100}%`;
  }

  function card(choice: Choice, side: Side, greener: boolean): HTMLButtonElement {
    const btn = h(
      'button',
      {
        class: 'choice-card',
        type: 'button',
        'data-side': side,
        'data-greener': e2e && greener ? 'true' : undefined,
        'aria-keyshortcuts': side === 0 ? '1 ArrowLeft' : '2 ArrowRight',
      },
      h('span', { class: 'choice-card__key', 'aria-hidden': 'true' }, String(side + 1)),
      h('span', { class: 'choice-card__art' }, image(choice.image)),
      h('span', { class: 'choice-card__name' }, choice.name),
    );
    btn.addEventListener('click', () => choose(side));
    return btn;
  }

  function renderPair(): void {
    const q = round?.current;
    if (!round || !q) return;
    const [left, right] =
      q.greenerSide === 0 ? [q.pair.greener, q.pair.other] : [q.pair.other, q.pair.greener];
    topic.textContent = TOPIC_LABELS[q.pair.topic];
    cards.replaceChildren(
      card(left, 0, q.greenerSide === 0),
      h('span', { class: 'choice-or', 'aria-hidden': 'true' }, 'or'),
      card(right, 1, q.greenerSide === 1),
    );
    cards.classList.remove('is-answered');
    feedback.hidden = true;
    renderStats();
    prompt.focus({ preventScroll: true });
    startTimer();
  }

  // ---------- Timer ----------

  function startTimer(): void {
    stopTimer();
    timer.hidden = level !== 'normal';
    if (level !== 'normal') return;
    elapsed = 0;
    lastFrame = performance.now();
    timerBar.style.transform = 'scaleX(1)';
    timer.classList.remove('is-low');
    frame = requestAnimationFrame(tickTimer);
  }

  function tickTimer(now: number): void {
    // Cap each step so time spent in a hidden tab doesn't count.
    elapsed += Math.min(now - lastFrame, 100);
    lastFrame = now;
    const left = Math.max(0, ANSWER_MS - elapsed);
    timerBar.style.transform = `scaleX(${left / ANSWER_MS})`;
    timer.classList.toggle('is-low', left < 3000);
    if (left <= 0) {
      frame = 0;
      const result = round?.timeout();
      if (result) showAnswer(null, result);
      return;
    }
    frame = requestAnimationFrame(tickTimer);
  }

  function stopTimer(): void {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  // ---------- Answering ----------

  function choose(side: Side): void {
    if (!round || round.answered) return;
    const result = round.answer(side, ANSWER_MS - elapsed);
    if (result) showAnswer(side, result);
  }

  function showAnswer(side: Side | null, result: AnswerResult): void {
    stopTimer();
    const q = round!.current!;
    cards.classList.add('is-answered');
    cards.querySelectorAll<HTMLButtonElement>('.choice-card').forEach((btn) => {
      const s = Number(btn.dataset.side) as Side;
      btn.disabled = true;
      if (s === q.greenerSide) {
        btn.classList.add('is-greener');
        btn.append(h('span', { class: 'choice-card__tag' }, icon('leaf', { size: 14 }), 'Greener'));
      } else if (s === side) {
        btn.classList.add('is-wrong');
      }
    });
    ctx.sound(result.correct ? 'good' : 'bad');
    if (!result.correct) haptic();

    const title = result.correct
      ? `Greener choice! +${result.points}`
      : result.timedOut
        ? `Time’s up! The greener choice: ${q.pair.greener.name}`
        : `Not this time. The greener choice: ${q.pair.greener.name}`;
    const nextBtn = h(
      'button',
      { class: 'btn btn--primary', type: 'button', onclick: next },
      round!.index + 1 >= round!.total ? 'See results' : 'Next',
      icon('arrowRight', { size: 16 }),
    );
    feedback.className = `choice-feedback ${result.correct ? 'is-correct' : 'is-wrong'}`;
    feedback.replaceChildren(
      h(
        'p',
        { class: 'choice-feedback__title' },
        icon(result.correct ? 'check' : 'x', { size: 18, strokeWidth: 3 }),
        title,
      ),
      h('p', { class: 'choice-feedback__text' }, q.pair.why),
      nextBtn,
    );
    feedback.hidden = false;
    ctx.announce(`${title}. ${q.pair.why}`);
    renderStats();
    nextBtn.focus({ preventScroll: true });
  }

  function next(): void {
    if (!round) return;
    ctx.sound('tap');
    if (round.next()) renderPair();
    else finish();
  }

  function finish(): void {
    if (!round) return;
    const r = round;
    const missed = r.questions.filter((q) => r.missed.includes(q.pair.id));
    const learnedFrom = missed.length > 0 ? missed : r.questions.slice(0, 3);
    ctx.sound('win');
    ctx.showResult({
      title:
        r.correct === r.total
          ? 'Every choice was greener!'
          : r.correct >= r.total * 0.7
            ? 'Great green choices!'
            : 'Good try!',
      score: r.score,
      stars: choiceStars(r.correct, r.total),
      isBest: ctx.submitScore(r.score),
      stats: [
        `${r.correct}/${r.total} greener picks`,
        `Best streak: ${r.bestStreak}`,
        LEVEL_LABELS[level],
      ],
      learned: learnedFrom
        .slice(0, compact ? 2 : 3)
        .map((q) => ({ term: q.pair.greener.name, detail: q.pair.why })),
      onReplay: start,
    });
  }

  // ---------- Keyboard: 1/2 or ←/→ to pick, Enter for the next pair ----------

  function onKey(e: KeyboardEvent): void {
    if (!intro.hidden || !round || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, select')) return;
    const side = KEY_SIDES[e.key];
    if (side !== undefined && !round.answered) {
      e.preventDefault();
      choose(side);
    }
  }

  function start(): void {
    intro.hidden = true;
    const recent = readJSON<string[]>(RECENT_KEY, []);
    const pairs = pickPairs(
      CHOICE_PAIRS,
      ROUND_SIZE,
      Math.random,
      Array.isArray(recent) ? recent : [],
    );
    writeJSON(
      RECENT_KEY,
      nextRecent(
        Array.isArray(recent) ? recent : [],
        pairs.map((p) => p.id),
      ),
    );
    round = new ChoiceRound(pairs, level, Math.random);
    renderPair();
    ctx.announce(
      level === 'normal'
        ? 'Pick the greener choice before the timer runs out.'
        : 'Pick the greener choice.',
    );
  }

  function showIntro(): void {
    stopTimer();
    intro.hidden = false;
    intro.querySelector<HTMLElement>('.intro__start')?.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', onKey);
  // Show a pair behind the start screen.
  round = new ChoiceRound(pickPairs(CHOICE_PAIRS, ROUND_SIZE, Math.random), level, Math.random);
  renderPair();
  stopTimer();
  intro.querySelector<HTMLElement>('.intro__start')?.focus({ preventScroll: true });

  return {
    destroy() {
      stopTimer();
      document.removeEventListener('keydown', onKey);
      host.replaceChildren();
    },
  };
}

import { CONCEPTS, type Concept } from '../../content/concepts';
import { h, haptic, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { renderIntro } from '../../ui/intro';
import { toast } from '../../ui/toast';
import {
  MemoryGame,
  bestGrid,
  buildDeck,
  pairsFor,
  scoreFor,
  starsFor,
  type Card,
  type Difficulty,
} from './logic';
import './memory.css';

const ACCENTS = ['leaf', 'sky', 'sun', 'coral', 'berry'] as const;
const accentFor = (concept: Concept) => ACCENTS[CONCEPTS.indexOf(concept) % ACCENTS.length];

function radioGroup<T extends string>(
  name: string,
  label: string,
  options: { value: T; text: string }[],
  selected: T,
  onChange: (value: T) => void,
): HTMLFieldSetElement {
  const group = h('fieldset', { class: 'segmented' }, h('legend', {}, label));
  for (const opt of options) {
    const input = h('input', {
      type: 'radio',
      name,
      value: opt.value,
      checked: opt.value === selected,
    });
    input.addEventListener('change', () => onChange(opt.value));
    group.appendChild(h('label', {}, input, h('span', {}, opt.text)));
  }
  return group;
}

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  let difficulty: Difficulty = 'medium';
  let players = 1;
  let game: MemoryGame | null = null;
  let startedAt = 0;
  let elapsed = 0;
  let tick: number | undefined;
  let resetTimer: number | undefined;
  let learned: Concept[] = [];

  const board = h('div', { class: 'mem-board', role: 'group', 'aria-label': 'Memory cards' });
  const stage = h('div', { class: 'mem-stage' }, board);
  const stats = h('div', { class: 'mem-stats' });
  const restart = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'New game' },
    icon('replay', { size: 18 }),
  );
  const settings = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change level or players' },
    icon('grid', { size: 18 }),
  );
  restart.addEventListener('click', () => newGame());
  settings.addEventListener('click', () => showIntro());
  // Phones have room for one button beside the title: "New game" opens the start
  // screen, where the level and players can be changed before playing again.
  const compact = isCompact();
  const newGameBtn = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'New game' },
    icon('replay', { size: 18 }),
  );
  newGameBtn.addEventListener('click', () => showIntro());

  const options = h(
    'div',
    { class: 'intro-options' },
    h(
      'div',
      { class: 'intro-option' },
      h('span', {}, 'Players'),
      radioGroup(
        'mem-players',
        'Players',
        [
          { value: '1', text: '1 player' },
          { value: '2', text: '2 players' },
        ],
        '1',
        (v) => (players = Number(v)),
      ),
    ),
    h(
      'div',
      { class: 'intro-option' },
      h('span', {}, 'Level'),
      radioGroup<Difficulty>(
        'mem-level',
        'Level',
        [
          { value: 'easy', text: 'Easy' },
          { value: 'medium', text: 'Medium' },
          { value: 'hard', text: 'Hard' },
        ],
        difficulty,
        (v) => (difficulty = v),
      ),
    ),
  );
  const intro = renderIntro(ctx.game, {
    options,
    onStart: () => {
      ctx.sound('tap');
      newGame();
    },
  });

  const root = h('div', { class: 'mem' }, stage, intro);
  host.replaceChildren(root);
  ctx.hud.replaceChildren(
    stats,
    h('div', { class: 'mem-hud__actions' }, ...(compact ? [newGameBtn] : [settings, restart])),
  );

  function showIntro(): void {
    window.clearInterval(tick);
    intro.hidden = false;
    intro.querySelector<HTMLElement>('.intro__start')?.focus({ preventScroll: true });
  }

  function renderStats(): void {
    if (!game) {
      stats.replaceChildren();
      return;
    }
    const g = game;
    if (players === 1) {
      replace(
        stats,
        h(
          'span',
          { class: 'stat' },
          icon('puzzle', { size: 14 }),
          `${g.matchedPairs}/${g.totalPairs}`,
        ),
        // Moves are left to the results dialog on phones, to keep the bar to one line.
        !compact && h('span', { class: 'stat' }, `${g.moves} ${g.moves === 1 ? 'move' : 'moves'}`),
        h('span', { class: 'stat' }, icon('timer', { size: 14 }), formatTime(elapsed)),
      );
    } else {
      replace(
        stats,
        ...g.pairsFound.map((p, i) =>
          h(
            'span',
            {
              class: `stat mem-player mem-player--${i} ${i === g.currentPlayer && !g.finished ? 'stat--active' : ''}`,
              'aria-current': i === g.currentPlayer ? 'true' : undefined,
            },
            icon('user', { size: 14 }),
            `P${i + 1}: ${p}`,
          ),
        ),
      );
    }
  }

  /** Sizes the board so every card is as large as possible in the space available. */
  function fitBoard(): void {
    if (!game) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const gap = rect.width < 500 ? 8 : 12;
    const fit = bestGrid(game.cards.length, rect.width, rect.height, gap);
    board.style.setProperty('--cols', String(fit.cols));
    board.style.setProperty('--gap', `${gap}px`);
    board.style.width = `${fit.cols * fit.cardWidth + (fit.cols - 1) * gap}px`;
    board.style.setProperty('--card-w', `${fit.cardWidth}px`);
    board.style.setProperty('--card-h', `${fit.cardHeight}px`);
  }

  function cardFace(card: Card): HTMLElement {
    const c = card.concept;
    return card.face === 'picture'
      ? h(
          'span',
          { class: 'mem-card__face mem-card__face--picture' },
          h('span', { class: 'mem-card__icon' }, icon(c.icon, { size: 40, strokeWidth: 1.75 })),
          h('span', { class: 'mem-card__caption' }, c.term),
        )
      : h(
          'span',
          { class: 'mem-card__face mem-card__face--word' },
          icon(c.icon, { size: 16 }),
          h('span', { class: 'mem-card__term' }, c.term),
        );
  }

  function cardLabel(card: Card, index: number): string {
    if (card.matched) return `${card.concept.term}, matched`;
    if (card.faceUp) return `${card.concept.term}, face up`;
    return `Card ${index + 1}, face down`;
  }

  function renderBoard(): void {
    if (!game) return;
    board.classList.toggle('mem-board--duo', players > 1);
    board.replaceChildren(
      ...game.cards.map((card, i) =>
        h(
          'button',
          {
            class: `mem-card accent-${accentFor(card.concept)}`,
            type: 'button',
            'data-index': i,
            'data-concept': card.concept.id,
            'aria-label': cardLabel(card, i),
            onclick: () => onFlip(i),
          },
          h(
            'span',
            { class: 'mem-card__inner' },
            h(
              'span',
              { class: 'mem-card__back', 'aria-hidden': 'true' },
              icon('leaf', { size: 24 }),
            ),
            cardFace(card),
          ),
        ),
      ),
    );
    fitBoard();
    syncCards();
  }

  function syncCards(): void {
    if (!game) return;
    const cards = game.cards;
    board.querySelectorAll<HTMLButtonElement>('.mem-card').forEach((el, i) => {
      const card = cards[i];
      if (!card) return;
      el.classList.toggle('is-up', card.faceUp || card.matched);
      el.classList.toggle('is-matched', card.matched);
      el.dataset.player = card.matchedBy === null ? '' : String(card.matchedBy);
      el.setAttribute('aria-label', cardLabel(card, i));
      el.setAttribute('aria-disabled', String(card.matched));
    });
  }

  function onFlip(index: number): void {
    if (!game) return;
    const g = game;
    // Tapping while a mismatch is showing skips the wait.
    if (g.awaitingReset) {
      window.clearTimeout(resetTimer);
      g.resetMismatch();
      syncCards();
      renderStats();
    }
    const outcome = g.flip(index);
    if (outcome.kind === 'ignored') return;
    if (!startedAt) {
      startedAt = performance.now();
      tick = window.setInterval(() => {
        elapsed = Math.floor((performance.now() - startedAt) / 1000);
        renderStats();
      }, 1000);
    }
    syncCards();

    if (outcome.kind === 'flipped') {
      ctx.sound('flip');
    } else if (outcome.kind === 'match') {
      ctx.sound('good');
      learned.push(outcome.concept);
      toast(outcome.concept.term, outcome.concept.detail);
      ctx.announce(`Match! ${outcome.concept.term}. ${outcome.concept.detail}`);
      if (outcome.finished) finish();
    } else if (outcome.kind === 'mismatch') {
      ctx.sound('bad');
      haptic();
      ctx.announce('Not a match.');
      resetTimer = window.setTimeout(
        () => {
          g.resetMismatch();
          syncCards();
          renderStats();
          if (players > 1) ctx.announce(`Player ${g.currentPlayer + 1}'s turn`);
        },
        prefersReducedMotion() ? 1400 : 1100,
      );
    }
    renderStats();
  }

  function finish(): void {
    if (!game) return;
    const g = game;
    window.clearInterval(tick);
    elapsed = Math.floor((performance.now() - startedAt) / 1000);
    renderStats();
    const pairs = g.totalPairs;
    const recap = learned.map((c) => ({ term: c.term, detail: c.detail }));
    window.setTimeout(() => {
      ctx.sound('win');
      if (players === 1) {
        const score = scoreFor(pairs, g.moves, elapsed);
        ctx.showResult({
          title: 'All pairs found!',
          score,
          stars: starsFor(pairs, g.moves),
          isBest: ctx.submitScore(score),
          stats: [`${g.moves} moves`, formatTime(elapsed), `${pairs} pairs`],
          learned: recap,
          onReplay: newGame,
        });
      } else {
        const winner = g.winner();
        ctx.showResult({
          title: winner === null ? "It's a draw!" : `Player ${winner + 1} wins!`,
          score: Math.max(...g.pairsFound),
          stars: 3,
          isBest: false,
          stats: g.pairsFound.map((p, i) => `Player ${i + 1}: ${p} pairs`),
          learned: recap,
          onReplay: newGame,
        });
      }
    }, 700);
  }

  function newGame(): void {
    window.clearInterval(tick);
    window.clearTimeout(resetTimer);
    intro.hidden = true;
    startedAt = 0;
    elapsed = 0;
    learned = [];
    game = new MemoryGame(buildDeck(CONCEPTS, pairsFor(difficulty, compact)), players);
    renderBoard();
    renderStats();
    board.querySelector<HTMLElement>('.mem-card')?.focus({ preventScroll: true });
  }

  const observer = new ResizeObserver(() => fitBoard());
  observer.observe(stage);

  // Deal a face-down board behind the start screen so the page never looks empty.
  newGame();
  showIntro();

  return {
    destroy() {
      window.clearInterval(tick);
      window.clearTimeout(resetTimer);
      observer.disconnect();
      host.replaceChildren();
    },
  };
}

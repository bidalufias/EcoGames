import { CONCEPTS, type Concept } from '../../content/concepts';
import { h, prefersReducedMotion } from '../../core/dom';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { toast } from '../../ui/toast';
import {
  MemoryGame,
  PAIRS,
  buildDeck,
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

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  let difficulty: Difficulty = 'medium';
  let players = 1;
  let game: MemoryGame;
  let startedAt = 0;
  let elapsed = 0;
  let tick: number | undefined;
  let resetTimer: number | undefined;
  let learned: Concept[] = [];

  const board = h('div', { class: 'mem-board', role: 'group', 'aria-label': 'Memory cards' });
  const stats = h('div', { class: 'mem-stats', 'aria-live': 'off' });

  const controls = h(
    'div',
    { class: 'mem-controls' },
    radioGroup(
      'mem-players',
      'Players',
      [
        { value: '1', text: '1 player' },
        { value: '2', text: '2 players' },
      ],
      '1',
      (v) => {
        players = Number(v);
        newGame();
      },
    ),
    radioGroup<Difficulty>(
      'mem-level',
      'Level',
      [
        { value: 'easy', text: 'Easy' },
        { value: 'medium', text: 'Medium' },
        { value: 'hard', text: 'Hard' },
      ],
      difficulty,
      (v) => {
        difficulty = v;
        newGame();
      },
    ),
    h(
      'button',
      { class: 'btn', type: 'button', onclick: () => newGame() },
      icon('replay', { size: 18 }),
      'New game',
    ),
  );

  host.replaceChildren(h('div', { class: 'mem' }, controls, stats, board));

  function formatTime(s: number): string {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function renderStats(): void {
    if (players === 1) {
      stats.replaceChildren(
        h(
          'span',
          { class: 'stat' },
          icon('puzzle', { size: 16 }),
          `${game.matchedPairs}/${game.totalPairs} pairs`,
        ),
        h(
          'span',
          { class: 'stat' },
          icon('replay', { size: 16 }),
          `${game.moves} ${game.moves === 1 ? 'move' : 'moves'}`,
        ),
        h('span', { class: 'stat' }, icon('timer', { size: 16 }), formatTime(elapsed)),
      );
    } else {
      stats.replaceChildren(
        ...game.pairsFound.map((p, i) =>
          h(
            'span',
            {
              class: `stat mem-player mem-player--${i} ${i === game.currentPlayer && !game.finished ? 'stat--active' : ''}`,
              'aria-current': i === game.currentPlayer ? 'true' : undefined,
            },
            icon('user', { size: 16 }),
            `Player ${i + 1}: ${p}`,
          ),
        ),
      );
    }
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
          icon(c.icon, { size: 18 }),
          h('span', { class: 'mem-card__term' }, c.term),
        );
  }

  function cardLabel(card: Card, index: number): string {
    if (card.matched) return `${card.concept.term}, matched`;
    if (card.faceUp) return `${card.concept.term}, face up`;
    return `Card ${index + 1}, face down`;
  }

  function renderBoard(): void {
    board.dataset.count = String(game.cards.length);
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
              icon('leaf', { size: 28 }),
            ),
            cardFace(card),
          ),
        ),
      ),
    );
    syncCards();
  }

  function syncCards(): void {
    board.querySelectorAll<HTMLButtonElement>('.mem-card').forEach((el, i) => {
      const card = game.cards[i];
      if (!card) return;
      el.classList.toggle('is-up', card.faceUp || card.matched);
      el.classList.toggle('is-matched', card.matched);
      el.dataset.player = card.matchedBy === null ? '' : String(card.matchedBy);
      el.setAttribute('aria-label', cardLabel(card, i));
      el.setAttribute('aria-disabled', String(card.matched));
    });
  }

  function onFlip(index: number): void {
    // Tapping while a mismatch is showing skips the wait.
    if (game.awaitingReset) {
      window.clearTimeout(resetTimer);
      game.resetMismatch();
      syncCards();
      renderStats();
    }
    const outcome = game.flip(index);
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
      ctx.announce('Not a match.');
      resetTimer = window.setTimeout(
        () => {
          game.resetMismatch();
          syncCards();
          renderStats();
          if (players > 1) ctx.announce(`Player ${game.currentPlayer + 1}'s turn`);
        },
        prefersReducedMotion() ? 1400 : 1100,
      );
    }
    renderStats();
  }

  function finish(): void {
    window.clearInterval(tick);
    elapsed = Math.floor((performance.now() - startedAt) / 1000);
    renderStats();
    const pairs = game.totalPairs;
    const recap = learned.map((c) => ({ term: c.term, detail: c.detail }));
    window.setTimeout(() => {
      ctx.sound('win');
      if (players === 1) {
        const score = scoreFor(pairs, game.moves, elapsed);
        ctx.showResult({
          title: 'All pairs found!',
          score,
          stars: starsFor(pairs, game.moves),
          isBest: ctx.submitScore(score),
          stats: [`${game.moves} moves`, formatTime(elapsed), `${pairs} pairs`],
          learned: recap,
          onReplay: newGame,
        });
      } else {
        const winner = game.winner();
        ctx.showResult({
          title: winner === null ? "It's a draw!" : `Player ${winner + 1} wins!`,
          score: Math.max(...game.pairsFound),
          stars: 3,
          isBest: false,
          stats: game.pairsFound.map((p, i) => `Player ${i + 1}: ${p} pairs`),
          learned: recap,
          onReplay: newGame,
        });
      }
    }, 700);
  }

  function newGame(): void {
    window.clearInterval(tick);
    window.clearTimeout(resetTimer);
    startedAt = 0;
    elapsed = 0;
    learned = [];
    game = new MemoryGame(buildDeck(CONCEPTS, PAIRS[difficulty]), players);
    renderBoard();
    renderStats();
  }

  newGame();

  return {
    destroy() {
      window.clearInterval(tick);
      window.clearTimeout(resetTimer);
      host.replaceChildren();
    },
  };
}

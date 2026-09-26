import { ECO_WORDS } from '../../content/words';
import { h, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { renderIntro } from '../../ui/intro';
import { GUESS_WORDS } from './dictionary';
import {
  CLUE_AFTER,
  MAX_GUESSES,
  WORD_LENGTH,
  WordGame,
  pickWords,
  wordStars,
  type Level,
  type Mark,
} from './logic';
import './eco-word.css';

const LEVEL_KEY = 'word-level';
const RECENT_KEY = 'word-recent';
const LEVELS: Level[] = ['easy', 'normal'];
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const MARK_WORDS: Record<Mark, string> = {
  correct: 'in the right place',
  present: 'in the word, somewhere else',
  absent: 'not in the word',
};
/** Time for one letter to flip over when a guess is marked. */
const FLIP_MS = 260;

const titleCase = (w: string) => w[0] + w.slice(1).toLowerCase();

function levelPicker(selected: Level, onChange: (level: Level) => void): HTMLElement {
  const group = h('fieldset', { class: 'segmented' }, h('legend', {}, 'Clue'));
  const labels: Record<Level, string> = {
    easy: 'From the start',
    normal: `After ${CLUE_AFTER.normal} guesses`,
  };
  for (const level of LEVELS) {
    const input = h('input', {
      type: 'radio',
      name: 'word-level',
      value: level,
      checked: level === selected,
    });
    input.addEventListener('change', () => onChange(level));
    group.appendChild(h('label', {}, input, h('span', {}, labels[level])));
  }
  return h(
    'div',
    { class: 'intro-options' },
    h('div', { class: 'intro-option' }, h('span', {}, 'Clue'), group),
  );
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const saved = readJSON<string>(LEVEL_KEY, 'normal');
  let level: Level = LEVELS.includes(saved as Level) ? (saved as Level) : 'normal';
  let game: WordGame | null = null;
  let busy = false;
  /** Enter pressed while a guess was still turning over, to submit once it has. */
  let queuedEnter = false;
  const timers = new Set<number>();
  const compact = isCompact();
  const reduced = prefersReducedMotion();
  const flipMs = reduced ? 0 : FLIP_MS;
  const dictionary = new Set(GUESS_WORDS.split(' ').map((w) => w.toUpperCase()));
  // End-to-end tests can fix the round's words: ?e2e&words=SOLAR,TIGER,OZONE
  const params = new URLSearchParams(window.location.search);
  const e2eWords = params.has('e2e') ? params.get('words') : null;

  const clue = h('p', { class: 'word-clue' });
  const message = h('p', { class: 'word-msg', 'aria-hidden': 'true' });
  const grid = h('div', { class: 'word-grid', 'aria-hidden': 'true' });
  const reveal = h('div', { class: 'word-reveal', hidden: true });
  const stage = h('div', { class: 'word-stage' }, grid, reveal);
  const keys = h('div', { class: 'word-keys', role: 'group', 'aria-label': 'Keyboard' });
  const stats = h('div', { class: 'word-stats' });

  const restart = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'New round' },
    icon('replay', { size: 18 }),
  );
  const settings = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change level' },
    icon('grid', { size: 18 }),
  );
  restart.addEventListener('click', () => (compact ? showIntro() : newRound()));
  settings.addEventListener('click', () => showIntro());

  const intro = renderIntro(ctx.game, {
    options: levelPicker(level, (l) => {
      level = l;
      writeJSON(LEVEL_KEY, l);
    }),
    onStart: () => {
      ctx.sound('tap');
      newRound();
    },
  });

  const root = h(
    'div',
    { class: 'word' },
    h('div', { class: 'word-top' }, clue, message),
    stage,
    keys,
    intro,
  );
  host.replaceChildren(root);
  ctx.hud.replaceChildren(
    stats,
    h('div', { class: 'word-hud__actions' }, ...(compact ? [restart] : [settings, restart])),
  );

  function later(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }

  function clearTimers(): void {
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
    queuedEnter = false;
  }

  // ---------- Drawing ----------

  function buildGrid(): void {
    grid.replaceChildren(
      ...Array.from({ length: MAX_GUESSES }, () =>
        h(
          'div',
          { class: 'word-row' },
          ...Array.from({ length: WORD_LENGTH }, () => h('span', { class: 'word-tile' })),
        ),
      ),
    );
  }

  function rowEls(i: number): HTMLElement[] {
    return [...(grid.children[i]?.children ?? [])] as HTMLElement[];
  }

  /** Draws every guess and the letters typed so far. */
  function renderGrid(): void {
    if (!game) return;
    const g = game;
    for (let r = 0; r < MAX_GUESSES; r++) {
      const past = g.guesses[r];
      const typing = r === g.guesses.length && !g.done ? g.current : '';
      const row = grid.children[r] as HTMLElement | undefined;
      // Marked rows are drawn once, so their flip animation isn't restarted.
      if (!row || row.dataset.marked) continue;
      if (past) row.dataset.marked = 'true';
      rowEls(r).forEach((tile, i) => {
        const letter = past ? past.word[i]! : (typing[i] ?? '');
        tile.textContent = letter;
        tile.className = 'word-tile';
        if (past) tile.classList.add(`is-${past.marks[i]}`);
        else if (letter) tile.classList.add('is-filled');
      });
    }
  }

  function buildKeys(): void {
    const key = (label: string, value: string, extra = '') => {
      const b = h(
        'button',
        { class: `word-key${extra}`, type: 'button', 'data-key': value },
        label === '⌫' ? icon('backspace', { size: 20 }) : label,
      );
      if (label === '⌫') b.setAttribute('aria-label', 'Delete letter');
      b.addEventListener('click', () => press(value));
      return b;
    };
    keys.replaceChildren(
      ...KEY_ROWS.map((row, i) =>
        h(
          'div',
          { class: 'word-keys__row' },
          i === 2 && key('Enter', 'Enter', ' word-key--wide'),
          ...[...row].map((l) => key(l, l)),
          i === 2 && key('⌫', 'Backspace', ' word-key--wide'),
        ),
      ),
    );
  }

  function renderKeys(): void {
    if (!game) return;
    const marks = game.letterMarks();
    for (const b of keys.querySelectorAll<HTMLButtonElement>('.word-key')) {
      const l = b.dataset.key!;
      if (l.length !== 1) continue;
      const m = marks.get(l);
      b.className = `word-key${m ? ` is-${m}` : ''}`;
      b.setAttribute('aria-label', m ? `${l}, ${MARK_WORDS[m]}` : l);
    }
  }

  function renderClue(): void {
    if (!game) return;
    const g = game;
    if (g.clueShown) {
      replace(clue, icon('lightbulb', { size: 16 }), h('span', {}, g.answer.clue));
      clue.classList.add('is-shown');
    } else {
      const left = CLUE_AFTER[level] - g.guesses.length;
      replace(
        clue,
        icon('lightbulb', { size: 16 }),
        h('span', {}, `Clue after ${left} more ${left === 1 ? 'guess' : 'guesses'}`),
      );
      clue.classList.remove('is-shown');
    }
  }

  function renderStats(): void {
    if (!game) return;
    const g = game;
    replace(
      stats,
      h(
        'span',
        { class: 'stat' },
        icon('star', { size: 14 }),
        String(g.score),
        h('span', { class: 'stat__label' }, ' pts'),
      ),
      h(
        'span',
        { class: 'stat' },
        icon('book', { size: 14 }),
        `${Math.min(g.index + 1, g.words.length)}/${g.words.length}`,
        h('span', { class: 'stat__label' }, ' words'),
      ),
    );
  }

  /** Sizes the letter tiles to the space the stage has. */
  function fitGrid(): void {
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const gap = rect.height < 300 ? 4 : 6;
    const tile = Math.floor(
      Math.min(
        (rect.width - gap * (WORD_LENGTH - 1)) / WORD_LENGTH,
        (rect.height - gap * (MAX_GUESSES - 1)) / MAX_GUESSES,
        64,
      ),
    );
    grid.style.setProperty('--tile', `${Math.max(tile, 16)}px`);
    grid.style.setProperty('--gap', `${gap}px`);
  }

  function say(text: string): void {
    message.textContent = text;
    message.classList.remove('is-shown');
    void message.offsetWidth;
    message.classList.add('is-shown');
    ctx.announce(text);
  }

  // ---------- Play ----------

  function press(key: string): void {
    if (!game || !intro.hidden) return;
    const g = game;
    if (g.done) {
      if (key === 'Enter' && !busy) nextWord();
      return;
    }
    // Typing carries on into the next row while a guess turns over; Enter waits.
    if (key === 'Enter') {
      if (busy) queuedEnter = true;
      else submit();
      return;
    }
    if (key === 'Backspace') {
      if (g.back()) renderGrid();
      return;
    }
    if (g.type(key)) {
      renderGrid();
      const tile = rowEls(g.guesses.length)[g.current.length - 1];
      tile?.classList.add('is-typed');
    }
  }

  function submit(): void {
    if (!game) return;
    const g = game;
    const row = g.guesses.length;
    const outcome = g.submit();
    if (outcome.kind !== 'scored') {
      say(outcome.kind === 'short' ? 'Not enough letters' : 'Not in the word list');
      ctx.sound('bad');
      const el = grid.children[row] as HTMLElement | undefined;
      el?.classList.remove('is-shake');
      void el?.offsetWidth;
      el?.classList.add('is-shake');
      return;
    }
    // Flip the letters over one by one, then show what happened.
    busy = true;
    renderGrid();
    rowEls(row).forEach((tile, i) => {
      tile.classList.add('is-flip');
      tile.style.animationDelay = `${i * flipMs * 0.6}ms`;
    });
    const guessed = g.guesses[row]!;
    ctx.announce(
      `${guessed.word}: ${[...guessed.word].map((l, i) => `${l} ${MARK_WORDS[guessed.marks[i]!]}`).join(', ')}.`,
    );
    later(
      () => {
        busy = false;
        renderKeys();
        const enterNext = queuedEnter && !g.done;
        queuedEnter = false;
        renderClue();
        renderStats();
        if (outcome.solved) {
          ctx.sound('good');
          showReveal(true, outcome.points);
        } else if (outcome.failed) {
          ctx.sound('bad');
          showReveal(false, 0);
        } else {
          ctx.sound('flip');
          if (g.clueShown && g.guesses.length === CLUE_AFTER[level]) say('Here’s a clue!');
          if (enterNext) submit();
        }
      },
      flipMs * (WORD_LENGTH * 0.6 + 1),
    );
  }

  function showReveal(solved: boolean, points: number): void {
    if (!game) return;
    const g = game;
    const last = g.index + 1 >= g.words.length;
    const next = h(
      'button',
      { class: 'btn btn--primary word-reveal__next', type: 'button' },
      last ? 'See results' : 'Next word',
      icon('arrowRight', { size: 16 }),
    );
    next.addEventListener('click', () => nextWord());
    replace(
      reveal,
      h(
        'div',
        { class: 'word-reveal__panel' },
        h('p', { class: 'word-reveal__title' }, solved ? `Solved! +${points}` : 'The word was'),
        h('p', { class: 'word-reveal__word' }, g.answer.word),
        h('p', { class: 'word-reveal__fact' }, g.answer.fact),
        next,
      ),
    );
    reveal.hidden = false;
    ctx.announce(`${solved ? 'Solved!' : `The word was ${g.answer.word}.`} ${g.answer.fact}`);
    next.focus({ preventScroll: true });
  }

  function nextWord(): void {
    if (!game) return;
    const g = game;
    reveal.hidden = true;
    if (!g.next()) return finish();
    buildGrid();
    renderGrid();
    renderKeys();
    renderClue();
    renderStats();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function finish(): void {
    if (!game) return;
    const g = game;
    const solved = g.solvedCount;
    ctx.sound(solved === g.words.length ? 'win' : 'good');
    ctx.showResult({
      title:
        solved === g.words.length
          ? 'All three words solved!'
          : solved > 0
            ? `You solved ${solved} of ${g.words.length}`
            : 'Better luck next round!',
      score: g.score,
      stars: wordStars(solved, g.totalGuesses, g.words.length),
      isBest: ctx.submitScore(g.score),
      stats: [
        `${solved}/${g.words.length} words`,
        `${g.totalGuesses} guesses`,
        `Clue ${level === 'easy' ? 'from the start' : `after ${CLUE_AFTER.normal}`}`,
      ],
      learned: g.results.map((r) => ({ term: titleCase(r.word.word), detail: r.word.fact })),
      onReplay: newRound,
    });
  }

  function newRound(): void {
    clearTimers();
    busy = false;
    intro.hidden = true;
    reveal.hidden = true;
    message.textContent = '';
    const fixed = e2eWords
      ?.split(',')
      .map((w) => ECO_WORDS.find((x) => x.word === w.toUpperCase()))
      .filter((w) => w !== undefined);
    const recent = readJSON<string[]>(RECENT_KEY, []);
    const words = fixed?.length ? fixed : pickWords(ECO_WORDS, Math.random, recent);
    writeJSON(RECENT_KEY, [...words.map((w) => w.word), ...recent].slice(0, 15));
    game = new WordGame(words, (w) => dictionary.has(w), level);
    buildGrid();
    buildKeys();
    renderGrid();
    renderKeys();
    renderClue();
    renderStats();
    fitGrid();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function showIntro(): void {
    clearTimers();
    busy = false;
    intro.hidden = false;
    intro.querySelector<HTMLButtonElement>('.intro__start')?.focus({ preventScroll: true });
  }

  // ---------- Keyboard ----------

  const playing = () => intro.hidden && !document.querySelector('dialog[open]');
  function onKeyDown(e: KeyboardEvent): void {
    if (!playing() || e.altKey || e.ctrlKey || e.metaKey) return;
    const onControl =
      e.target instanceof HTMLElement && e.target.closest('button, a, input, select');
    if (e.key === 'Enter' || e.key === 'Backspace') {
      // Enter on a focused button presses that button instead.
      if (onControl && e.key === 'Enter') return;
      e.preventDefault();
      press(e.key);
    } else if (/^[a-z]$/i.test(e.key)) {
      e.preventDefault();
      press(e.key.toUpperCase());
    }
  }
  document.addEventListener('keydown', onKeyDown);

  const observer = new ResizeObserver(() => fitGrid());
  observer.observe(stage);

  // Set up a round behind the start screen so the page never looks empty.
  newRound();
  showIntro();

  return {
    destroy() {
      clearTimers();
      observer.disconnect();
      document.removeEventListener('keydown', onKeyDown);
      host.replaceChildren();
    },
  };
}

import { BUILDINGS, CITY_FACT, type BuildingKind } from '../../content/city';
import { h, haptic, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { image } from '../../ui/images';
import { renderIntro } from '../../ui/intro';
import { CityBoard, LEVEL_SIZE, buildDeck, cityStars, type Level } from './logic';
import './green-city.css';

const LEVEL_KEY = 'city-level';
const LEVELS: Level[] = ['easy', 'normal'];
const LEVEL_LABELS: Record<Level, string> = { easy: 'Small (4×4)', normal: 'Big (5×5)' };
const KINDS = Object.keys(BUILDINGS) as BuildingKind[];
const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function levelPicker(selected: Level, onChange: (level: Level) => void): HTMLElement {
  const group = h('fieldset', { class: 'segmented' }, h('legend', {}, 'Town size'));
  for (const level of LEVELS) {
    const input = h('input', {
      type: 'radio',
      name: 'city-level',
      value: level,
      checked: level === selected,
    });
    input.addEventListener('change', () => onChange(level));
    group.appendChild(h('label', {}, input, h('span', {}, LEVEL_LABELS[level])));
  }
  return h(
    'div',
    { class: 'intro-options' },
    h('div', { class: 'intro-option' }, h('span', {}, 'Town size'), group),
  );
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const saved = readJSON<string>(LEVEL_KEY, 'normal');
  let level: Level = LEVELS.includes(saved as Level) ? (saved as Level) : 'normal';
  const compact = isCompact();
  const reduced = prefersReducedMotion();
  // End-to-end tests can fix the first buildings: ?e2e&deck=home,park,...
  const params = new URLSearchParams(window.location.search);
  const e2eDeck = params.has('e2e')
    ? (params.get('deck') ?? '')
        .split(',')
        .filter((k): k is BuildingKind => KINDS.includes(k as BuildingKind))
    : [];

  let board = new CityBoard(LEVEL_SIZE[level], Math.random);
  /** Which of the two offered buildings is selected. */
  let choice = 0;
  /** The cell being previewed (hover, focus, or a first tap on touch screens). */
  let previewAt = -1;
  /** The cell that has keyboard focus (roving tabindex). */
  let focusAt = 0;
  /** How the last press started, so a first tap on a touch screen only previews. */
  let lastPointer = '';
  let cellEls: HTMLButtonElement[] = [];
  const timers = new Set<number>();

  const grid = h('div', { class: 'city-board', role: 'grid', 'aria-label': 'Town' });
  const stage = h('div', { class: 'city-stage' }, grid);
  const offers = h('div', { class: 'city-offers', role: 'group', 'aria-label': 'Buildings' });
  const hint = h('p', { class: 'city-hint' });
  const panel = h(
    'aside',
    { class: 'city-panel' },
    h('h2', { class: 'city-panel__title' }, 'Choose a building'),
    offers,
    hint,
  );
  const stats = h('div', { class: 'city-stats' });

  const intro = renderIntro(ctx.game, {
    options: levelPicker(level, (l) => {
      level = l;
      writeJSON(LEVEL_KEY, l);
    }),
    startLabel: 'Start building',
    onStart: () => {
      ctx.sound('tap');
      start();
    },
  });

  const restart = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'New town' },
    icon('replay', { size: 18 }),
  );
  const settings = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change town size' },
    icon('grid', { size: 18 }),
  );
  restart.addEventListener('click', () => (compact ? showIntro() : start()));
  settings.addEventListener('click', () => showIntro());

  host.replaceChildren(h('div', { class: 'city' }, panel, stage, intro));
  ctx.hud.replaceChildren(
    stats,
    h('div', { class: 'city-hud__actions' }, ...(compact ? [restart] : [settings, restart])),
  );

  function later(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }

  // ---------- Drawing ----------

  function renderStats(): void {
    const turn = Math.min(board.turn + 1, board.turns);
    replace(
      stats,
      h(
        'span',
        { class: 'stat city-turn' },
        h('span', { class: 'stat__label' }, 'Turn '),
        `${turn}/${board.turns}`,
      ),
      h(
        'span',
        { class: 'stat city-score' },
        icon('leaf', { size: 14 }),
        `${board.total()}`,
        h('span', { class: 'stat__label' }, ' pts'),
      ),
    );
  }

  function renderOffers(): void {
    offers.replaceChildren(
      ...board.offer.map((kind, i) => {
        const b = BUILDINGS[kind];
        const btn = h(
          'button',
          {
            class: `city-offer${i === choice ? ' is-selected' : ''}`,
            type: 'button',
            'aria-pressed': i === choice ? 'true' : 'false',
            'aria-keyshortcuts': String(i + 1),
            'data-kind': kind,
          },
          h('span', { class: 'city-offer__key', 'aria-hidden': 'true' }, String(i + 1)),
          h('span', { class: 'city-offer__art' }, image(b.image)),
          h(
            'span',
            { class: 'city-offer__text' },
            h('span', { class: 'city-offer__name' }, b.name),
            h('span', { class: 'city-offer__rule' }, b.rule),
          ),
        );
        btn.addEventListener('click', () => select(i));
        return btn;
      }),
    );
    hint.textContent = compact
      ? 'Tap a square to see the points, then tap it again to build.'
      : 'Point at a square to see the points. Click to build.';
  }

  function cellLabel(i: number): string {
    const row = Math.floor(i / board.size) + 1;
    const col = (i % board.size) + 1;
    const kind = board.cells[i];
    if (!kind) return `Row ${row}, column ${col}: empty`;
    return `Row ${row}, column ${col}: ${BUILDINGS[kind].name}, ${plural(board.scoreAt(i), 'point')}`;
  }

  function buildBoard(): void {
    grid.style.setProperty('--n', String(board.size));
    cellEls = board.cells.map((_, i) => {
      const btn = h('button', {
        class: 'city-cell',
        type: 'button',
        role: 'gridcell',
        tabindex: i === focusAt ? '0' : '-1',
        'data-index': i,
      });
      btn.addEventListener('pointerdown', (e) => (lastPointer = e.pointerType));
      btn.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') showPreview(i);
      });
      btn.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse' && previewAt === i) showPreview(-1);
      });
      btn.addEventListener('focus', () => {
        focusAt = i;
        if (lastPointer !== 'touch') showPreview(i);
      });
      btn.addEventListener('click', () => onCell(i));
      return btn;
    });
    grid.replaceChildren(...cellEls);
    fitBoard();
  }

  function renderCell(i: number): void {
    const el = cellEls[i];
    if (!el) return;
    const kind = board.cells[i];
    el.setAttribute('aria-label', cellLabel(i));
    el.classList.toggle('is-built', !!kind);
    if (!kind) {
      el.replaceChildren();
      delete el.dataset.kind;
      return;
    }
    el.dataset.kind = kind;
    const points = board.scoreAt(i);
    el.replaceChildren(
      h('span', { class: 'city-cell__art' }, image(BUILDINGS[kind].image)),
      h(
        'span',
        {
          class: `city-cell__points${points > 0 ? ' city-up' : points < 0 ? ' city-down' : ''}`,
          'aria-hidden': 'true',
        },
        signed(points),
      ),
    );
  }

  function renderBoard(): void {
    board.cells.forEach((_, i) => renderCell(i));
  }

  /** Shows what building the selected offer at cell `i` would do (-1 clears it). */
  function showPreview(i: number): void {
    for (const el of cellEls) {
      el.classList.remove('is-preview', 'is-affected');
      el.querySelector('.city-ghost')?.remove();
      el.querySelector('.city-change')?.remove();
    }
    previewAt = -1;
    const kind = board.offer[choice];
    if (i < 0 || !kind || board.cells[i]) return;
    const p = board.preview(i, kind);
    if (!p) return;
    previewAt = i;
    const el = cellEls[i]!;
    el.classList.add('is-preview');
    el.append(
      h(
        'span',
        { class: 'city-ghost', 'aria-hidden': 'true' },
        image(BUILDINGS[kind].image),
        h(
          'span',
          {
            class: `city-ghost__delta${p.delta > 0 ? ' city-up' : p.delta < 0 ? ' city-down' : ''}`,
          },
          signed(p.delta),
        ),
      ),
    );
    for (const [n, change] of p.neighbours) {
      const nel = cellEls[n]!;
      nel.classList.add('is-affected');
      nel.append(
        h(
          'span',
          { class: `city-change${change > 0 ? ' city-up' : ' city-down'}`, 'aria-hidden': 'true' },
          signed(change),
        ),
      );
    }
  }

  function fitBoard(): void {
    const rect = stage.getBoundingClientRect();
    const n = board.size;
    const gap = rect.width < 420 ? 5 : 8;
    const fit = Math.floor(
      Math.min((rect.width - (n + 1) * gap) / n, (rect.height - (n + 1) * gap) / n),
    );
    const cell = Math.max(40, Math.min(120, fit));
    grid.style.setProperty('--cell', `${cell}px`);
    grid.style.setProperty('--gap', `${gap}px`);
  }

  // ---------- Playing ----------

  function select(i: number): void {
    if (i >= board.offer.length || i === choice) return;
    choice = i;
    ctx.sound('tap');
    renderOffers();
    showPreview(previewAt >= 0 ? previewAt : -1);
  }

  function onCell(i: number): void {
    if (board.done || board.cells[i]) {
      if (board.cells[i]) ctx.announce(cellLabel(i));
      return;
    }
    // On touch screens the first tap previews, and a second tap on the same square builds.
    if (lastPointer === 'touch' && previewAt !== i) {
      showPreview(i);
      const p = board.preview(i, board.offer[choice]!);
      if (p)
        ctx.announce(
          `${BUILDINGS[board.offer[choice]!].name} here: ${signed(p.delta)} points. Tap again to build.`,
        );
      return;
    }
    build(i);
  }

  function build(i: number): void {
    const result = board.place(i, choice);
    if (!result) return;
    choice = 0;
    ctx.sound(result.delta > 0 ? 'drop' : result.delta < 0 ? 'bad' : 'flip');
    if (result.delta < 0) haptic();
    showPreview(-1);
    renderCell(i);
    const placed = cellEls[i]!;
    if (!reduced) placed.classList.add('is-new');
    later(() => placed.classList.remove('is-new'), 400);
    for (const [n, change] of result.neighbours) {
      renderCell(n);
      const nel = cellEls[n]!;
      nel.append(
        h(
          'span',
          { class: `city-float${change > 0 ? ' city-up' : ' city-down'}`, 'aria-hidden': 'true' },
          signed(change),
        ),
      );
      later(() => nel.querySelector('.city-float')?.remove(), 900);
    }
    renderStats();
    const name = BUILDINGS[result.kind].name;
    ctx.announce(`${name} built: ${signed(result.delta)} points. ${board.total()} in total.`);
    if (board.done) {
      offers.replaceChildren();
      later(finish, reduced ? 200 : 700);
      return;
    }
    renderOffers();
  }

  function finish(): void {
    const score = Math.max(0, board.total());
    const { homes, nearStation, nearFactory } = board.homeStats();
    const stars = cityStars(score, board.size);
    // Lead with the lesson this town needed most.
    const kinds: BuildingKind[] = [];
    if (nearFactory > 0) kinds.push('factory');
    if (nearStation < homes / 2) kinds.push('station');
    kinds.push('park', 'home', 'solar', 'shop');
    const learned = [
      ...[...new Set(kinds)].map((k) => ({ term: BUILDINGS[k].name, detail: BUILDINGS[k].fact })),
    ].slice(0, compact ? 1 : 2);
    ctx.sound(stars >= 2 ? 'win' : 'good');
    ctx.showResult({
      title:
        stars === 3
          ? 'A green city to be proud of!'
          : stars >= 1
            ? 'A greener town!'
            : 'Town built!',
      score,
      stars,
      isBest: ctx.submitScore(score),
      stats: [
        `Homes by a station: ${nearStation}/${homes}`,
        `Homes by a factory: ${nearFactory}`,
        LEVEL_LABELS[level],
      ],
      learned: [...learned, CITY_FACT],
      onReplay: start,
    });
  }

  // ---------- Keyboard: arrows move, Enter/Space builds, 1/2 picks a building ----------

  function onKey(e: KeyboardEvent): void {
    if (!intro.hidden || board.done || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, select')) return;
    // A keyboard press (Enter or Space on a square) builds straight away, like a click.
    lastPointer = '';
    if (e.key === '1' || e.key === '2') {
      e.preventDefault();
      select(Number(e.key) - 1);
      return;
    }
    const move = ARROWS[e.key];
    if (!move) return;
    e.preventDefault();
    const n = board.size;
    const inBoard = e.target instanceof HTMLElement && grid.contains(e.target);
    const from = inBoard ? focusAt : Math.max(0, board.cells.indexOf(null));
    const row = Math.min(n - 1, Math.max(0, Math.floor(from / n) + (inBoard ? move[0] : 0)));
    const col = Math.min(n - 1, Math.max(0, (from % n) + (inBoard ? move[1] : 0)));
    focusCell(row * n + col);
  }

  function focusCell(i: number): void {
    cellEls[focusAt]?.setAttribute('tabindex', '-1');
    focusAt = i;
    const el = cellEls[i];
    el?.setAttribute('tabindex', '0');
    el?.focus({ preventScroll: true });
  }

  function start(): void {
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
    intro.hidden = true;
    const size = LEVEL_SIZE[level];
    const deck = e2eDeck.length > 0 ? [...e2eDeck, ...buildDeck(size, Math.random)] : undefined;
    board = new CityBoard(size, Math.random, deck);
    choice = 0;
    previewAt = -1;
    focusAt = Math.floor((size * size) / 2);
    buildBoard();
    renderBoard();
    renderOffers();
    renderStats();
    ctx.announce(
      `Build a green town on a ${size} by ${size} grid. Each building scores for what is next to it.`,
    );
    if (!compact) focusCell(focusAt);
  }

  function showIntro(): void {
    intro.hidden = false;
    intro.querySelector<HTMLElement>('.intro__start')?.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', onKey);
  const observer = new ResizeObserver(() => fitBoard());
  observer.observe(stage);

  // Show an empty town behind the start screen.
  buildBoard();
  renderBoard();
  renderOffers();
  renderStats();
  intro.querySelector<HTMLElement>('.intro__start')?.focus({ preventScroll: true });

  return {
    destroy() {
      for (const id of timers) window.clearTimeout(id);
      document.removeEventListener('keydown', onKey);
      observer.disconnect();
      host.replaceChildren();
    },
  };
}

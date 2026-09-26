import { FOREST_STAGES, type ForestStage } from '../../content/forest';
import { h, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { image } from '../../ui/images';
import { renderIntro } from '../../ui/intro';
import { toast } from '../../ui/toast';
import {
  ForestBoard,
  LEVEL_LABEL,
  LEVEL_SIZE,
  forestStars,
  type Dir,
  type Level,
  type MoveResult,
  type Tile,
} from './logic';
import './forest-merge.css';

const LEVEL_KEY = 'forest-level';
const LEVELS: Level[] = ['easy', 'normal'];
const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};
/** How far a finger must travel to count as a swipe, in CSS pixels. */
const SWIPE = 24;

const stageOf = (stage: number): ForestStage =>
  FOREST_STAGES[Math.min(stage, FOREST_STAGES.length) - 1]!;

/**
 * A stage's picture: its main image in front, with any extra images around it, so a
 * grove or a forest shows several trees. Scales to whatever box it is put in.
 */
function stageArt(s: ForestStage): HTMLElement {
  const extra = (spots: string[]) =>
    (s.extras ?? [])
      .filter((x) => spots.includes(x.at))
      .map((x) => h('span', { class: `forest-art__x forest-art__x--${x.at}` }, image(x.image)));
  return h(
    'span',
    { class: `forest-art${s.extras?.some((x) => x.at !== 'corner') ? ' forest-art--group' : ''}` },
    ...extra(['back', 'left', 'right']),
    h('span', { class: 'forest-art__main' }, image(s.image)),
    ...extra(['corner']),
  );
}

function levelPicker(selected: Level, onChange: (level: Level) => void): HTMLElement {
  const group = h('fieldset', { class: 'segmented' }, h('legend', {}, 'Board'));
  for (const level of LEVELS) {
    const input = h('input', {
      type: 'radio',
      name: 'forest-level',
      value: level,
      checked: level === selected,
    });
    input.addEventListener('change', () => onChange(level));
    const size = LEVEL_SIZE[level];
    group.appendChild(
      h('label', {}, input, h('span', {}, `${LEVEL_LABEL[level]} ${size}×${size}`)),
    );
  }
  return h(
    'div',
    { class: 'intro-options' },
    h('div', { class: 'intro-option' }, h('span', {}, 'Board'), group),
  );
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const saved = readJSON<string>(LEVEL_KEY, 'normal');
  let level: Level = LEVELS.includes(saved as Level) ? (saved as Level) : 'normal';
  let game: ForestBoard | null = null;
  let endTimer: number | undefined;
  /** Finishes the last move's merges: removes the old tiles and shows the grown ones. */
  let pending: (() => void)[] = [];
  let pendingTimer: number | undefined;
  const els = new Map<number, HTMLElement>();
  const compact = isCompact();
  const reduced = prefersReducedMotion();
  const slideMs = reduced ? 0 : 120;
  // End-to-end tests can start from a set board: ?e2e&board=1,2,0,...
  const params = new URLSearchParams(window.location.search);
  const e2eBoard = params.has('e2e') ? params.get('board') : null;

  const cells = h('div', { class: 'forest-cells', 'aria-hidden': 'true' });
  const layer = h('div', { class: 'forest-tiles', 'aria-hidden': 'true' });
  const board = h(
    'div',
    { class: 'forest-board', role: 'img', 'aria-label': 'Forest board' },
    cells,
    layer,
  );
  const chain = h('ol', { class: 'forest-chain', 'aria-label': 'What grows next' });
  const stage = h('div', { class: 'forest-stage' }, board);
  const stats = h('div', { class: 'forest-stats' });

  const restart = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'New game' },
    icon('replay', { size: 18 }),
  );
  const settings = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change board' },
    icon('grid', { size: 18 }),
  );
  restart.addEventListener('click', () => (compact ? showIntro() : newGame()));
  settings.addEventListener('click', () => showIntro());

  const intro = renderIntro(ctx.game, {
    options: levelPicker(level, (l) => {
      level = l;
      writeJSON(LEVEL_KEY, l);
    }),
    onStart: () => {
      ctx.sound('tap');
      newGame();
    },
  });

  const root = h('div', { class: 'forest' }, stage, chain, intro);
  host.replaceChildren(root);
  ctx.hud.replaceChildren(
    stats,
    h('div', { class: 'forest-hud__actions' }, ...(compact ? [restart] : [settings, restart])),
  );

  function clearTimers(): void {
    window.clearTimeout(endTimer);
    window.clearTimeout(pendingTimer);
    pending = [];
  }

  /** Runs the last move's finishing touches now (a new move can't wait for them). */
  function flushPending(): void {
    window.clearTimeout(pendingTimer);
    const run = pending;
    pending = [];
    for (const fn of run) fn();
  }

  // ---------- Drawing ----------

  function tileEl(tile: Tile): HTMLElement {
    const s = stageOf(tile.stage);
    const el = h(
      'div',
      { class: `forest-tile forest-tile--s${tile.stage}` },
      h('span', { class: 'forest-tile__img' }, stageArt(s)),
      h('span', { class: 'forest-tile__name', title: s.name }, s.short ?? s.name),
    );
    place(el, tile);
    return el;
  }

  /** Adds a tile that pops in once the slide is over ('new' fades in, 'grown' bounces). */
  function addLater(tile: Tile, appear: 'new' | 'grown'): HTMLElement {
    const el = tileEl(tile);
    el.classList.add('is-waiting');
    els.set(tile.id, el);
    layer.appendChild(el);
    pending.push(() => {
      el.classList.remove('is-waiting');
      el.classList.add(appear === 'new' ? 'is-new' : 'is-grown');
    });
    return el;
  }

  function place(el: HTMLElement, tile: Tile): void {
    el.style.setProperty('--row', String(tile.row));
    el.style.setProperty('--col', String(tile.col));
  }

  function renderAll(): void {
    if (!game) return;
    const n = game.size;
    cells.replaceChildren(
      ...Array.from({ length: n * n }, () => h('span', { class: 'forest-cell' })),
    );
    layer.replaceChildren();
    els.clear();
    for (const t of game.tiles) {
      const el = tileEl(t);
      el.classList.add('is-new');
      els.set(t.id, el);
      layer.appendChild(el);
    }
    fitBoard();
    renderStats();
    renderChain();
  }

  function applyMove(r: MoveResult): void {
    flushPending();
    for (const t of r.slid) {
      const el = els.get(t.id);
      if (el) place(el, t);
    }
    for (const g of r.grown) {
      // Both old tiles slide into the cell. Only when they get there do they give way
      // to the grown tile, in the same frame, so nothing jumps or flickers.
      for (const id of g.from) {
        const el = els.get(id);
        if (!el) continue;
        els.delete(id);
        place(el, g.tile);
        el.classList.add('is-leaving');
        pending.push(() => el.remove());
      }
      addLater(g.tile, 'grown');
    }
    if (r.spawned) addLater(r.spawned, 'new');
    if (slideMs === 0) flushPending();
    else pendingTimer = window.setTimeout(flushPending, slideMs);
  }

  function renderStats(): void {
    if (!game) return;
    const best = stageOf(game.highest);
    replace(
      stats,
      h(
        'span',
        { class: 'stat' },
        icon('star', { size: 14 }),
        String(game.score),
        h('span', { class: 'stat__label' }, ' pts'),
      ),
      h(
        'span',
        { class: 'stat forest-best', title: 'Best so far' },
        h('span', { class: 'forest-best__img' }, stageArt(best)),
        compact ? null : best.name,
      ),
    );
    board.setAttribute(
      'aria-label',
      `Forest board, ${game.size} by ${game.size}. Best so far: ${best.name}. ${game.tiles.length} of ${game.size * game.size} spaces used.`,
    );
  }

  function renderChain(): void {
    if (!game) return;
    const highest = game.highest;
    chain.replaceChildren(
      ...FOREST_STAGES.map((s) => {
        const label = s.stage <= highest + 1 ? s.name : 'Not grown yet';
        return h(
          'li',
          {
            class: `forest-chain__step${s.stage <= highest ? ' is-reached' : ''}${s.stage === highest + 1 ? ' is-next' : ''}`,
            title: label,
          },
          h('span', { class: 'sr-only' }, label),
          stageArt(s),
        );
      }),
    );
  }

  /** Sizes the square board to the space left in the stage. */
  function fitBoard(): void {
    if (!game) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const n = game.size;
    const side = Math.floor(Math.min(rect.width, rect.height, 620));
    const gap = side < 340 ? 6 : 10;
    const cell = Math.floor((side - gap * (n + 1)) / n);
    board.style.setProperty('--n', String(n));
    board.style.setProperty('--gap', `${gap}px`);
    board.style.setProperty('--cell', `${cell}px`);
    board.classList.toggle('is-small', cell < 72);
  }

  // ---------- Play ----------

  function onMove(dir: Dir): void {
    if (!game || game.over || !intro.hidden) return;
    const g = game;
    const before = g.highest;
    const r = g.move(dir);
    if (!r.moved) {
      board.classList.remove('is-bump');
      void board.offsetWidth;
      board.classList.add('is-bump');
      return;
    }
    applyMove(r);
    renderStats();
    if (r.grown.length > 0) {
      ctx.sound(r.firsts.length > 0 ? 'good' : 'drop');
      const top = r.grown.reduce((a, b) => (b.tile.stage > a.tile.stage ? b : a));
      ctx.announce(`${stageOf(top.tile.stage).name} grown! ${g.score} points.`);
    } else {
      ctx.sound('flip');
    }
    if (g.highest > before) renderChain();
    const first = r.firsts.filter((s) => s >= 3).at(-1);
    if (first) {
      const s = stageOf(first);
      toast(`New: ${s.name}!`, s.fact, 4200);
    }
    if (g.over) finish();
  }

  function finish(): void {
    if (!game) return;
    const g = game;
    const won = g.won;
    ctx.sound(won ? 'win' : 'bad');
    const best = stageOf(g.highest);
    ctx.announce(
      won
        ? 'You grew the Amazon rainforest! The forest is complete.'
        : `No more moves. You grew up to ${best.name}.`,
    );
    board.classList.add(won ? 'is-won' : 'is-over');
    // Facts for the best few stages grown, from the top down.
    const learned = FOREST_STAGES.filter((s) => s.stage <= g.highest)
      .reverse()
      .slice(0, compact ? 2 : 3)
      .map((s) => ({ term: s.name, detail: s.fact }));
    endTimer = window.setTimeout(
      () => {
        ctx.showResult({
          title: won ? 'You grew a whole rainforest!' : `You grew up to ${best.name}!`,
          score: g.score,
          stars: forestStars(g.highest, level),
          isBest: ctx.submitScore(g.score),
          stats: [
            `Best: ${best.name}`,
            `${g.moves} moves`,
            `${LEVEL_LABEL[level]} ${g.size}×${g.size}`,
          ],
          learned,
          onReplay: newGame,
        });
      },
      reduced ? 300 : 900,
    );
  }

  function newGame(): void {
    clearTimers();
    intro.hidden = true;
    board.classList.remove('is-won', 'is-over');
    const size = LEVEL_SIZE[level];
    const start = e2eBoard?.split(',').map(Number);
    game = new ForestBoard(start ? Math.round(Math.sqrt(start.length)) : size, Math.random, start);
    renderAll();
    // Arrow keys work anywhere on the page, so move focus off the start button.
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function showIntro(): void {
    clearTimers();
    intro.hidden = false;
    intro.querySelector<HTMLButtonElement>('.intro__start')?.focus({ preventScroll: true });
  }

  // ---------- Input: arrow keys or WASD, and swipes ----------

  const playing = () => intro.hidden && !document.querySelector('dialog[open]');
  function onKeyDown(e: KeyboardEvent): void {
    if (!playing() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target instanceof HTMLElement && e.target.closest('button, a, input, select')) return;
    const dir = KEY_DIRS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!dir) return;
    e.preventDefault();
    onMove(dir);
  }

  let swipe: { id: number; x: number; y: number } | null = null;
  function onPointerDown(e: PointerEvent): void {
    if (!playing()) return;
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: PointerEvent): void {
    if (!swipe || swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
    if (Math.abs(dx) > Math.abs(dy)) onMove(dx > 0 ? 'right' : 'left');
    else onMove(dy > 0 ? 'down' : 'up');
  }
  const cancelSwipe = () => (swipe = null);

  document.addEventListener('keydown', onKeyDown);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', cancelSwipe);

  const observer = new ResizeObserver(() => fitBoard());
  observer.observe(stage);

  // Deal a board behind the start screen so the page never looks empty.
  newGame();
  showIntro();

  return {
    destroy() {
      clearTimers();
      observer.disconnect();
      document.removeEventListener('keydown', onKeyDown);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', cancelSwipe);
      host.replaceChildren();
    },
  };
}

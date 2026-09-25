import { SOLAR_FACTS } from '../../content/solar';
import { h, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { image } from '../../ui/images';
import { renderIntro } from '../../ui/intro';
import {
  DIRS,
  LEVEL_LABEL,
  LEVEL_SIZE,
  SolarGame,
  cableShape,
  generatePuzzle,
  nextItems,
  rotateMask,
  solarScore,
  solarStars,
  turnsToSolve,
  type Level,
  type Tile,
} from './logic';
import './solar-link.css';

const LEVEL_KEY = 'solar-level';
const FACT_KEY = 'solar-fact';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Where each side's cable end meets the tile edge, in the tile's 100×100 viewBox. */
const EDGE: Record<number, string> = { 1: '50 0', 2: '100 50', 4: '50 100', 8: '0 50' };
const SIDE_NAME: Record<number, string> = { 1: 'up', 2: 'right', 4: 'down', 8: 'left' };
const SHAPE_NAME = {
  end: 'cable end',
  straight: 'straight cable',
  corner: 'corner cable',
  tee: 'T cable',
  cross: 'cross cable',
} as const;
const LEVELS: Level[] = ['easy', 'medium', 'hard'];

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function levelPicker(selected: Level, onChange: (level: Level) => void): HTMLElement {
  const group = h('fieldset', { class: 'segmented' }, h('legend', {}, 'Level'));
  for (const level of LEVELS) {
    const input = h('input', {
      type: 'radio',
      name: 'solar-level',
      value: level,
      checked: level === selected,
    });
    input.addEventListener('change', () => onChange(level));
    group.appendChild(h('label', {}, input, h('span', {}, LEVEL_LABEL[level])));
  }
  return h(
    'div',
    { class: 'intro-options' },
    h('div', { class: 'intro-option' }, h('span', {}, 'Level'), group),
  );
}

/** The tile's cable as drawn in its solved position; CSS turns it to the current one. */
function cableSvg(shape: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'solar-tile__cable');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  const d = DIRS.filter((dir) => shape & dir)
    .map((dir) => `M50 50L${EDGE[dir]}`)
    .join('');
  path.setAttribute('d', d);
  svg.appendChild(path);
  return svg;
}

/** Quarter turns from the drawn (solved) shape to the tile's current cable ends. */
function quarterTurns(tile: Tile): number {
  for (let k = 0; k < 4; k++) if (rotateMask(tile.shape, k) === tile.mask) return k;
  return 0;
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const saved = readJSON<string>(LEVEL_KEY, 'easy');
  let level: Level = LEVELS.includes(saved as Level) ? (saved as Level) : 'easy';
  let game: SolarGame | null = null;
  let startedAt = 0;
  let elapsed = 0;
  let tick: number | undefined;
  let winTimer: number | undefined;
  let focusIndex = 0;
  // Each tile's drawn angle keeps growing, so every turn animates clockwise.
  let angles: number[] = [];
  const compact = isCompact();
  // Opt-in hint for end-to-end tests (?e2e in the URL); never used in normal play.
  const e2e = new URLSearchParams(window.location.search).has('e2e');

  const board = h('div', { class: 'solar-board', role: 'grid', 'aria-label': 'Power grid' });
  const stage = h('div', { class: 'solar-stage' }, board);
  const stats = h('div', { class: 'solar-stats' });
  const restart = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'New puzzle' },
    icon('replay', { size: 18 }),
  );
  const settings = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change level' },
    icon('grid', { size: 18 }),
  );
  restart.addEventListener('click', () => newGame());
  settings.addEventListener('click', () => showIntro());
  // Phones have room for one button beside the title: "New puzzle" opens the start
  // screen, where the level can be changed before playing again.
  const newGameBtn = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'New puzzle' },
    icon('replay', { size: 18 }),
  );
  newGameBtn.addEventListener('click', () => showIntro());

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

  const root = h('div', { class: 'solar' }, stage, intro);
  host.replaceChildren(root);
  ctx.hud.replaceChildren(
    stats,
    h('div', { class: 'solar-hud__actions' }, ...(compact ? [newGameBtn] : [settings, restart])),
  );

  function showIntro(): void {
    window.clearInterval(tick);
    window.clearTimeout(winTimer);
    intro.hidden = false;
    intro.querySelector<HTMLElement>('.intro__start')?.focus({ preventScroll: true });
  }

  function renderStats(): void {
    if (!game) return;
    const g = game;
    replace(
      stats,
      h(
        'span',
        { class: 'stat' },
        icon('house', { size: 14 }),
        `${g.poweredHomes}/${g.totalHomes}`,
        h('span', { class: 'stat__label' }, ' homes'),
      ),
      h(
        'span',
        { class: 'stat' },
        icon('rotateCw', { size: 14 }),
        String(g.turns),
        h('span', { class: 'stat__label' }, g.turns === 1 ? ' turn' : ' turns'),
      ),
      // Time is left to the results dialog on phones, to keep the bar to one line.
      !compact && h('span', { class: 'stat' }, icon('timer', { size: 14 }), formatTime(elapsed)),
    );
  }

  /** Sizes the grid so the square tiles are as large as fit in the stage. */
  function fitBoard(): void {
    if (!game) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const n = game.board.size;
    const gap = rect.width < 360 ? 2 : rect.width < 500 ? 3 : 4;
    // n tiles with a gap between each and around the edge of the board.
    const fit = Math.min(rect.width, rect.height) - gap * (n + 1);
    const tile = Math.max(0, Math.min(Math.floor(fit / n), 120));
    board.style.setProperty('--n', String(n));
    board.style.setProperty('--gap', `${gap}px`);
    board.style.setProperty('--tile', `${tile}px`);
  }

  function tileLabel(tile: Tile, index: number, powered: boolean): string {
    const n = game?.board.size ?? 1;
    const where = `Row ${Math.floor(index / n) + 1}, column ${(index % n) + 1}`;
    const what =
      tile.kind === 'source'
        ? 'solar farm'
        : tile.kind === 'home'
          ? 'home'
          : SHAPE_NAME[cableShape(tile.shape)];
    const sides = DIRS.filter((d) => tile.mask & d).map((d) => SIDE_NAME[d]);
    const connects =
      sides.length === 4
        ? 'connects all sides'
        : `connects ${sides.slice(0, -1).join(', ')}${sides.length > 1 ? ' and ' : ''}${sides.at(-1)}`;
    return `${where}, ${what}, ${connects}, ${powered ? 'powered' : 'not powered'}`;
  }

  function renderBoard(): void {
    if (!game) return;
    const n = game.board.size;
    board.classList.remove('is-won');
    angles = game.board.tiles.map((t) => quarterTurns(t) * 90);
    const rows: HTMLElement[] = [];
    game.board.tiles.forEach((tile, i) => {
      if (i % n === 0) rows.push(h('div', { class: 'solar-row', role: 'row' }));
      const btn = h(
        'button',
        {
          class: `solar-tile solar-tile--${tile.kind}`,
          type: 'button',
          tabindex: i === focusIndex ? 0 : -1,
          'data-index': i,
          onclick: () => onTurn(i),
        },
        cableSvg(tile.shape),
        tile.kind !== 'cable' &&
          h('span', { class: 'solar-tile__img' }, image(tile.kind === 'source' ? 'sun' : 'house')),
      );
      rows.at(-1)!.appendChild(h('div', { role: 'gridcell', class: 'solar-cell' }, btn));
    });
    board.replaceChildren(...rows);
    fitBoard();
    syncTiles();
  }

  function tileButtons(): HTMLButtonElement[] {
    return [...board.querySelectorAll<HTMLButtonElement>('.solar-tile')];
  }

  function syncTiles(): void {
    if (!game) return;
    const { tiles } = game.board;
    const powered = game.powered;
    tileButtons().forEach((btn, i) => {
      const tile = tiles[i]!;
      const on = powered.has(i);
      btn.classList.toggle('is-powered', on);
      btn.setAttribute('aria-label', tileLabel(tile, i, on));
      btn.querySelector<SVGElement>('svg')!.style.transform = `rotate(${angles[i]}deg)`;
      if (e2e) btn.dataset.turns = String(turnsToSolve(tile));
    });
  }

  function moveFocus(index: number): void {
    const buttons = tileButtons();
    const next = buttons[index];
    if (!next) return;
    buttons[focusIndex]?.setAttribute('tabindex', '-1');
    focusIndex = index;
    next.setAttribute('tabindex', '0');
    next.focus({ preventScroll: true });
  }

  function onKey(e: KeyboardEvent): void {
    if (!game) return;
    const n = game.board.size;
    const row = Math.floor(focusIndex / n);
    const col = focusIndex % n;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, col],
      ArrowDown: [row + 1, col],
      ArrowLeft: [row, col - 1],
      ArrowRight: [row, col + 1],
      Home: [row, 0],
      End: [row, n - 1],
    };
    const to = moves[e.key];
    if (!to) return;
    e.preventDefault();
    const [r, c] = to;
    if (r >= 0 && r < n && c >= 0 && c < n) moveFocus(r * n + c);
  }
  board.addEventListener('keydown', onKey);

  function onTurn(index: number): void {
    if (!game) return;
    const g = game;
    const before = g.poweredHomes;
    const outcome = g.turn(index);
    if (outcome.kind === 'ignored') return;
    if (index !== focusIndex) moveFocus(index);
    if (!startedAt) {
      startedAt = performance.now();
      tick = window.setInterval(() => {
        elapsed = Math.floor((performance.now() - startedAt) / 1000);
        renderStats();
      }, 1000);
    }
    angles[index]! += 90;
    syncTiles();
    renderStats();

    if (outcome.solved) {
      finish();
    } else if (outcome.newlyPowered.length > 0) {
      ctx.sound('good');
      ctx.announce(`Home powered! ${outcome.poweredHomes} of ${g.totalHomes} homes`);
    } else {
      ctx.sound('flip');
      if (outcome.poweredHomes < before) {
        ctx.announce(`A home lost power. ${outcome.poweredHomes} of ${g.totalHomes} homes`);
      }
    }
  }

  function finish(): void {
    if (!game) return;
    const g = game;
    window.clearInterval(tick);
    elapsed = Math.floor((performance.now() - startedAt) / 1000);
    renderStats();
    ctx.sound('win');
    ctx.announce(`Every home has solar power! Solved in ${g.turns} turns.`);
    board.classList.add('is-won');
    const n = g.board.size;
    const { picked, next } = nextItems(SOLAR_FACTS, readJSON<number>(FACT_KEY, 0), compact ? 2 : 3);
    writeJSON(FACT_KEY, next);
    winTimer = window.setTimeout(
      () => {
        const score = solarScore(n, g.par, g.turns, elapsed);
        ctx.showResult({
          title: 'Every home has power!',
          score,
          stars: solarStars(g.par, g.turns),
          isBest: ctx.submitScore(score),
          stats: [
            `${g.turns} turns`,
            `Par ${g.par}`,
            `${LEVEL_LABEL[level]} ${n}×${n}`,
            formatTime(elapsed),
          ],
          learned: picked.map((f) => ({ term: f.term, detail: f.detail })),
          onReplay: newGame,
        });
      },
      prefersReducedMotion() ? 400 : 1200,
    );
  }

  function newGame(): void {
    window.clearInterval(tick);
    window.clearTimeout(winTimer);
    intro.hidden = true;
    startedAt = 0;
    elapsed = 0;
    focusIndex = 0;
    game = new SolarGame(generatePuzzle(LEVEL_SIZE[level], Math.random));
    renderBoard();
    renderStats();
    tileButtons()[0]?.focus({ preventScroll: true });
  }

  const observer = new ResizeObserver(() => fitBoard());
  observer.observe(stage);

  // Deal a board behind the start screen so the page never looks empty.
  newGame();
  showIntro();

  return {
    destroy() {
      window.clearInterval(tick);
      window.clearTimeout(winTimer);
      observer.disconnect();
      board.removeEventListener('keydown', onKey);
      host.replaceChildren();
    },
  };
}

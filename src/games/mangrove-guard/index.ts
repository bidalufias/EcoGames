import * as Phaser from 'phaser';
import {
  MANGROVE_FACTS,
  MANGROVE_SPECIES,
  RUBBISH_FACT,
  type MangroveFact,
} from '../../content/mangroves';
import { h, haptic, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { image } from '../../ui/images';
import { renderIntro } from '../../ui/intro';
import { toast } from '../../ui/toast';
import { GuardScene } from './GuardScene';
import {
  COLS,
  HOUSES,
  LEVELS,
  SPECIES,
  guardStars,
  type Guard,
  type Level,
  type SpeciesId,
} from './logic';
import './mangrove-guard.css';

const LEVEL_KEY = 'mangrove-level';
const FACT_KEY = 'mangrove-fact';
const SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];
const KEY_DIRS: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const NURSERY = MANGROVE_FACTS.find((f) => f.id === 'nursery')!;
const WAVE_BREAKERS = MANGROVE_FACTS.find((f) => f.id === 'wave-breakers')!;

/** Game resolution: container size × device pixel ratio (capped), so the canvas stays sharp. */
function gameSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    width: Math.max(320, Math.round(rect.width * dpr)),
    height: Math.max(240, Math.round(rect.height * dpr)),
  };
}

function levelPicker(selected: Level, onChange: (level: Level) => void): HTMLElement {
  const group = h('fieldset', { class: 'segmented' }, h('legend', {}, 'Level'));
  const names: Record<Level, string> = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
  for (const level of Object.keys(LEVELS) as Level[]) {
    const input = h('input', {
      type: 'radio',
      name: 'mangrove-level',
      value: level,
      checked: level === selected,
    });
    input.addEventListener('change', () => onChange(level));
    group.appendChild(h('label', {}, input, h('span', {}, names[level])));
  }
  return h(
    'div',
    { class: 'intro-options' },
    h('div', { class: 'intro-option' }, h('span', {}, 'Level'), group),
  );
}

/** Facts for the results: a few at a time, in turn. */
function nextFacts(start: number, count: number): { picked: MangroveFact[]; next: number } {
  const n = MANGROVE_FACTS.length;
  const from = ((start % n) + n) % n;
  const picked = Array.from({ length: count }, (_, i) => MANGROVE_FACTS[(from + i) % n]!);
  return { picked, next: (from + count) % n };
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const compact = isCompact();
  const saved = readJSON<string>(LEVEL_KEY, 'normal');
  let level: Level = saved in LEVELS ? (saved as Level) : 'normal';
  const params = new URLSearchParams(window.location.search);
  // Opt-in hooks for end-to-end tests (?e2e in the URL); never used in normal play.
  const e2e = params.has('e2e');
  let species: SpeciesId = 'api-api';
  /** Facts the player has met this game, for first-time tips and the results. */
  let met = new Set<string>();
  let shown = '';
  let tideText = '';

  const stage = h('div', {
    class: 'mangrove-stage',
    tabindex: '-1',
    role: 'application',
    'aria-label':
      'Coast. Arrow keys to move, Space to plant a mangrove or pick up rubbish, 1 and 2 to choose a tree.',
  });
  const tide = h('p', { class: 'mangrove-tide', 'aria-hidden': 'true' });
  const speciesBtns = SPECIES_IDS.map((id, i) => {
    const s = MANGROVE_SPECIES[id];
    const btn = h(
      'button',
      {
        class: 'mangrove-species',
        type: 'button',
        'data-species': id,
        'aria-keyshortcuts': String(i + 1),
      },
      h('span', { class: 'mangrove-species__art' }, image(id === 'bakau' ? 'tree' : 'seedling')),
      h(
        'span',
        { class: 'mangrove-species__text' },
        h('span', { class: 'mangrove-species__name' }, s.name),
        h('span', { class: 'mangrove-species__tag' }, s.tag),
      ),
      h(
        'span',
        { class: 'mangrove-species__cost', 'aria-label': `costs ${SPECIES[id].cost} seedlings` },
        icon('sprout', { size: 14 }),
        String(SPECIES[id].cost),
      ),
    );
    btn.addEventListener('click', () => choose(id));
    return btn;
  });
  const tray = h(
    'div',
    { class: 'mangrove-tray' },
    h('div', { class: 'mangrove-picks', role: 'group', 'aria-label': 'Mangroves' }, ...speciesBtns),
    tide,
  );
  const intro = renderIntro(ctx.game, {
    options: levelPicker(level, (l) => {
      level = l;
      writeJSON(LEVEL_KEY, l);
    }),
    startLabel: 'Start planting',
    onStart: () => start(),
  });
  const startBtn = intro.querySelector<HTMLButtonElement>('.intro__start')!;
  startBtn.disabled = true;
  host.replaceChildren(h('div', { class: 'mangrove' }, stage, tray, intro));

  const levelBtn = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change level' },
    icon('grid', { size: 18 }),
  );
  levelBtn.addEventListener('click', () => showIntro());

  function renderHud(g: Guard | null): void {
    const seeds = g?.seedlings ?? 0;
    const houses = g?.houses ?? HOUSES;
    const key = `${seeds}|${houses}|${g?.score ?? 0}`;
    if (key !== shown) {
      shown = key;
      replace(
        ctx.hud,
        h(
          'span',
          { class: 'stat mangrove-seeds', 'aria-label': `${seeds} seedlings to plant` },
          icon('sprout', { size: 14 }),
          `${seeds}`,
          h('span', { class: 'stat__label' }, ' seedlings'),
        ),
        h(
          'span',
          {
            class: `stat mangrove-houses${houses < HOUSES ? ' mangrove-houses--hit' : ''}`,
            'aria-label': `${houses} of ${HOUSES} houses dry`,
          },
          icon('house', { size: 14 }),
          `${houses}/${HOUSES}`,
          h('span', { class: 'stat__label' }, ' dry'),
        ),
        !compact &&
          h(
            'span',
            { class: 'stat mangrove-score' },
            icon('star', { size: 14 }),
            `${g?.score ?? 0}`,
            h('span', { class: 'stat__label' }, ' pts'),
          ),
        !compact && levelBtn,
      );
    }
    // Which mangroves the player can afford right now.
    speciesBtns.forEach((btn, i) => {
      btn.classList.toggle('is-short', seeds < SPECIES[SPECIES_IDS[i]!].cost);
    });
    const text = !g
      ? ''
      : g.progress === 0
        ? 'Calm sea: plant now!'
        : g.progress >= 1 && g.waves.length === 0
          ? 'All calm'
          : tideText;
    if (tide.textContent !== text) tide.textContent = text;
  }

  function choose(id: SpeciesId): void {
    species = id;
    scene.species = id;
    speciesBtns.forEach((btn) => {
      const on = btn.dataset.species === id;
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function firstTime(fact: { id: string; term: string; detail: string }): void {
    if (met.has(fact.id)) return;
    met.add(fact.id);
    toast(fact.term, fact.detail, 4200);
  }

  const dark = document.documentElement.dataset.theme === 'dark';
  const scene = new GuardScene(
    {
      onChange: (g) => renderHud(g),
      onEvent: (e, g) => {
        switch (e.kind) {
          case 'tide':
            if (e.surge) {
              tideText = 'Storm surge!';
              ctx.sound('bad');
              ctx.announce('A storm surge is coming in every lane!');
              firstTime({ ...WAVE_BREAKERS, term: 'Storm surge!' });
            } else {
              tideText = `Tide ${e.tide + 1} of ${g.spec.tides.length}`;
              ctx.announce(
                e.tide === 0
                  ? 'The tide is coming in.'
                  : `Tide ${e.tide + 1}: the waves are getting bigger.`,
              );
            }
            break;
          case 'broken':
            ctx.sound('good');
            ctx.announce('The mangroves calmed a wave.');
            break;
          case 'hit':
            if (e.uprooted) {
              ctx.sound('bad');
              ctx.announce('A wave tore out a young mangrove.');
            }
            break;
          case 'flood':
            ctx.sound('bad');
            haptic(80);
            ctx.announce(
              `A wave flooded a house! ${g.houses} of ${HOUSES} ${g.houses === 1 ? 'house is' : 'houses are'} still dry.`,
            );
            break;
          case 'grown': {
            const s = MANGROVE_SPECIES[e.plant.species];
            firstTime({ id: s.id, term: s.name, detail: s.fact });
            break;
          }
          case 'fish':
            firstTime(NURSERY);
            break;
          case 'rubbish':
            ctx.announce('A wave left rubbish in the roots. Pick it up!');
            firstTime(RUBBISH_FACT);
            break;
          default:
            break;
        }
      },
      onAction: (result) => {
        if (result.kind === 'planted') {
          ctx.sound('drop');
          ctx.announce(`${MANGROVE_SPECIES[result.plant.species].name} planted.`);
        } else if (result.kind === 'cleared') {
          ctx.sound('good');
          ctx.announce('Rubbish picked up.');
        } else if (result.reason === 'cost') {
          ctx.sound('bad');
          const s = MANGROVE_SPECIES[result.species];
          ctx.announce(`Not enough seedlings. ${s.name} needs ${SPECIES[result.species].cost}.`);
        }
      },
      onGameOver: (g) => {
        const safe = g.ended === 'safe';
        ctx.sound(safe ? 'win' : 'bad');
        const count = compact ? 2 : 3;
        const { picked, next } = nextFacts(readJSON<number>(FACT_KEY, 0), count);
        writeJSON(FACT_KEY, next);
        const metFacts = [
          ...SPECIES_IDS.filter((id) => met.has(id)).map((id) => ({
            term: MANGROVE_SPECIES[id].name,
            detail: MANGROVE_SPECIES[id].fact,
          })),
          ...(met.has(RUBBISH_FACT.id) ? [RUBBISH_FACT] : []),
        ];
        ctx.showResult({
          title: !safe
            ? 'The village flooded'
            : g.houses === HOUSES
              ? 'Every house stayed dry!'
              : 'The village is safe!',
          score: g.score,
          stars: guardStars(g.houses, g.ended),
          isBest: ctx.submitScore(g.score),
          stats: [
            `${g.houses}/${HOUSES} houses dry`,
            `${g.broken} ${g.broken === 1 ? 'wave' : 'waves'} calmed`,
            `${g.fish} young fish`,
          ],
          learned: [...metFacts.slice(0, 1), ...picked]
            .slice(0, count)
            .map((f) => ({ term: f.term, detail: f.detail })),
          onReplay: start,
        });
      },
    },
    {
      dark,
      reducedMotion: prefersReducedMotion(),
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      short: e2e && params.has('short'),
    },
  );
  choose(species);
  renderHud(null);

  // ---------- Keyboard: arrows move, Space/Enter plants or picks up, 1/2 picks a tree ----------
  const playing = () => intro.hidden && !document.querySelector('dialog[open]');
  function describe(): void {
    const c = scene.describeCursor();
    const where = `Lane ${c.lane + 1}, ${COLS - c.col} from the sea`;
    const what = c.rubbish
      ? 'rubbish to pick up'
      : c.plant
        ? `${MANGROVE_SPECIES[c.plant.species].name}${c.plant.grown ? '' : ' seedling'}`
        : 'empty mud';
    ctx.announce(`${where}: ${what}.`);
  }
  function onKeyDown(e: KeyboardEvent): void {
    if (!playing() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target instanceof HTMLElement && e.target.closest('button, a, input, select')) return;
    const dir = KEY_DIRS[e.key];
    if (dir) {
      e.preventDefault();
      scene.moveCursor(dir);
      describe();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) scene.actAtCursor();
    } else if (e.key === '1' || e.key === '2') {
      e.preventDefault();
      choose(SPECIES_IDS[Number(e.key) - 1]!);
      ctx.announce(`${MANGROVE_SPECIES[species].name} chosen.`);
    }
  }
  document.addEventListener('keydown', onKeyDown);

  function start(): void {
    intro.hidden = true;
    met = new Set();
    shown = '';
    tideText = '';
    ctx.sound('tap');
    scene.startGame(level, Math.floor(Math.random() * 2 ** 32));
    ctx.announce('Plant mangroves on the mud to calm the waves before they reach the village.');
    stage.focus({ preventScroll: true });
  }

  function showIntro(): void {
    scene.stop();
    intro.hidden = false;
    startBtn.focus({ preventScroll: true });
  }

  let destroyed = false;
  let game: Phaser.Game | null = null;

  // Wait for the UI font so canvas text renders in it, then boot Phaser.
  const fontReady = document.fonts
    ?.load('800 16px "Plus Jakarta Sans Variable"')
    .catch(() => undefined);
  void Promise.resolve(fontReady).then(() => {
    if (destroyed) return;
    const size = gameSize(stage);
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: stage,
      width: size.width,
      height: size.height,
      transparent: true,
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      input: { keyboard: false },
      scene,
    });
    if (e2e) (window as unknown as { __guard: unknown }).__guard = { scene, game };
    game.events.once(Phaser.Core.Events.READY, () => {
      startBtn.disabled = false;
      startBtn.focus({ preventScroll: true });
    });
  });

  // Keep the canvas resolution matched to the stage when the window resizes.
  let resizeTimer: number | undefined;
  const observer = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!game) return;
      const size = gameSize(stage);
      if (
        Math.abs(size.width - game.scale.width) > 2 ||
        Math.abs(size.height - game.scale.height) > 2
      ) {
        game.scale.setGameSize(size.width, size.height);
      }
    }, 150);
  });
  observer.observe(stage);

  return {
    destroy() {
      destroyed = true;
      scene.stop();
      document.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      game?.destroy(true);
      host.replaceChildren();
    },
  };
}

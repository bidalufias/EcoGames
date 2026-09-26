import * as Phaser from 'phaser';
import { BEACH_LIGHT, GHOST_CRAB } from '../../content/turtles';
import { h, haptic, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { renderIntro } from '../../ui/intro';
import { toast } from '../../ui/toast';
import { HATCHLINGS, LEVELS, trekFacts, trekStars, type Dir, type Level, type Trek } from './logic';
import { TrekScene } from './TrekScene';
import './turtle-trek.css';

const LEVEL_KEY = 'turtle-level';
const FACT_KEY = 'turtle-fact';
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

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Game resolution: container size × device pixel ratio (capped), so the canvas stays sharp. */
function gameSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    width: Math.max(320, Math.round(rect.width * dpr)),
    height: Math.max(320, Math.round(rect.height * dpr)),
  };
}

function levelPicker(selected: Level, onChange: (level: Level) => void): HTMLElement {
  const group = h('fieldset', { class: 'segmented' }, h('legend', {}, 'Level'));
  const names: Record<Level, string> = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
  for (const level of Object.keys(LEVELS) as Level[]) {
    const input = h('input', {
      type: 'radio',
      name: 'turtle-level',
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

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const compact = isCompact();
  const saved = readJSON<string>(LEVEL_KEY, 'normal');
  let level: Level = saved in LEVELS ? (saved as Level) : 'normal';
  const params = new URLSearchParams(window.location.search);
  // Opt-in hooks for end-to-end tests (?e2e in the URL); never used in normal play.
  const e2e = params.has('e2e');
  const trekSeconds = e2e ? Number(params.get('night')) : 0;
  /** Things the player has met this trek, for the results and first-time tips. */
  let met = new Set<string>();
  let shown = '';

  const stage = h('div', {
    class: 'trek-stage',
    tabindex: '-1',
    role: 'application',
    'aria-label': 'Beach. Arrow keys to crawl, Space to switch off a light.',
  });
  const intro = renderIntro(ctx.game, {
    options: levelPicker(level, (l) => {
      level = l;
      writeJSON(LEVEL_KEY, l);
    }),
    startLabel: 'Start the trek',
    onStart: () => start(),
  });
  const startBtn = intro.querySelector<HTMLButtonElement>('.intro__start')!;
  startBtn.disabled = true;
  stage.append(intro);
  host.replaceChildren(h('div', { class: 'trek' }, stage));

  const levelBtn = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change level' },
    icon('grid', { size: 18 }),
  );
  levelBtn.addEventListener('click', () => showIntro());

  function renderHud(trek: Trek | null): void {
    const safe = trek?.saved ?? 0;
    const time = trek?.timeLeft ?? 0;
    const key = `${safe}|${trek?.score ?? 0}|${Math.ceil(time / 1000)}`;
    if (key === shown) return;
    shown = key;
    replace(
      ctx.hud,
      h(
        'span',
        { class: 'stat trek-safe', 'aria-label': `${safe} of ${HATCHLINGS} hatchlings safe` },
        icon('turtle', { size: 14 }),
        `${safe}/${HATCHLINGS}`,
        h('span', { class: 'stat__label' }, ' safe'),
      ),
      !compact &&
        h(
          'span',
          { class: 'stat trek-score' },
          icon('star', { size: 14 }),
          `${trek?.score ?? 0}`,
          h('span', { class: 'stat__label' }, ' pts'),
        ),
      h(
        'span',
        { class: `stat trek-time${time <= 10_000 && trek ? ' trek-time--low' : ''}` },
        icon('sun', { size: 14 }),
        formatTime(time),
        h('span', { class: 'stat__label' }, ' to sunrise'),
      ),
      !compact && levelBtn,
    );
  }
  renderHud(null);

  function firstTime(id: string, title: string, fact: string): void {
    if (met.has(id)) return;
    met.add(id);
    toast(title, fact, 4200);
  }

  const dark = document.documentElement.dataset.theme === 'dark';
  const scene = new TrekScene(
    {
      onChange: (trek) => renderHud(trek),
      onEvent: (e, trek) => {
        switch (e.kind) {
          case 'saved':
            ctx.sound('good');
            ctx.announce(
              `${e.byWave ? 'A wave carried it out to sea!' : 'Into the sea!'} ${trek.saved} of ${HATCHLINGS} safe.`,
            );
            break;
          case 'scared':
            ctx.sound('bad');
            haptic(60);
            ctx.announce('A ghost crab! The hatchling ran back to the nest.');
            firstTime(GHOST_CRAB.id, GHOST_CRAB.name, GHOST_CRAB.fact);
            break;
          case 'pulled':
            ctx.announce('The bright light is pulling the hatchling the wrong way. Switch it off!');
            firstTime(BEACH_LIGHT.id, BEACH_LIGHT.name, BEACH_LIGHT.fact);
            break;
          case 'light-on':
            ctx.announce('Someone switched a beach light on.');
            break;
          case 'light-off':
            ctx.sound('tap');
            ctx.announce('Light switched off.');
            break;
          case 'blocked':
            ctx.sound('flip');
            firstTime(e.rubbish.id, e.rubbish.name, e.rubbish.fact);
            break;
          case 'end':
            break;
          case 'wave':
            break;
        }
      },
      onGameOver: (trek) => {
        const allSafe = trek.ended === 'all-safe';
        ctx.sound(allSafe ? 'win' : 'good');
        const count = compact ? 2 : 3;
        const { picked, next } = trekFacts(readJSON<number>(FACT_KEY, 0), count);
        writeJSON(FACT_KEY, next);
        ctx.showResult({
          title: allSafe
            ? 'Every hatchling reached the sea!'
            : trek.saved > 0
              ? `${trek.saved} hatchlings reached the sea`
              : 'The sun came up',
          score: trek.score,
          stars: trekStars(trek.saved),
          isBest: ctx.submitScore(trek.score),
          stats: [
            `${trek.saved}/${HATCHLINGS} safe`,
            `${trek.scares} ${trek.scares === 1 ? 'scare' : 'scares'}`,
            allSafe ? `${formatTime(trek.timeLeft)} before sunrise` : 'Sunrise',
          ],
          learned: [
            ...[GHOST_CRAB, BEACH_LIGHT]
              .filter((t) => met.has(t.id))
              .map((t) => ({ term: t.name, detail: t.fact })),
            ...picked.map((f) => ({ term: f.term, detail: f.detail })),
          ].slice(0, count),
          onReplay: start,
        });
      },
    },
    {
      dark,
      reducedMotion: prefersReducedMotion(),
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      trekMs: trekSeconds > 0 ? trekSeconds * 1000 : undefined,
      calm: e2e && params.has('calm'),
    },
  );

  // ---------- Keyboard: arrows or WASD to crawl, Space/Enter/L to switch off a light ----------
  const held: Dir[] = [];
  const playing = () => intro.hidden && !document.querySelector('dialog[open]');
  function onKeyDown(e: KeyboardEvent): void {
    if (!playing() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target instanceof HTMLElement && e.target.closest('button, a, input, select')) return;
    const dir = KEY_DIRS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (dir) {
      e.preventDefault();
      if (!held.includes(dir)) held.push(dir);
      scene.heldDir = held.at(-1) ?? null;
    } else if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'l') {
      e.preventDefault();
      if (!e.repeat) scene.switchOffLight();
    }
  }
  function onKeyUp(e: KeyboardEvent): void {
    const dir = KEY_DIRS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!dir) return;
    held.splice(held.indexOf(dir), 1);
    scene.heldDir = held.at(-1) ?? null;
  }
  function releaseKeys(): void {
    held.length = 0;
    scene.heldDir = null;
  }
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', releaseKeys);

  function start(): void {
    intro.hidden = true;
    met = new Set();
    shown = '';
    releaseKeys();
    ctx.sound('tap');
    scene.startTrek(level, Math.floor(Math.random() * 2 ** 32));
    ctx.announce('Guide each hatchling down the beach to the sea before sunrise.');
    stage.focus({ preventScroll: true });
  }

  function showIntro(): void {
    scene.stop();
    releaseKeys();
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
    if (e2e) (window as unknown as { __trek: unknown }).__trek = { scene, game };
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
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseKeys);
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      game?.destroy(true);
      host.replaceChildren();
    },
  };
}

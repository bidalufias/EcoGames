import * as Phaser from 'phaser';
import { ENERGY_TIPS, ROOMS } from '../../content/energy';
import { h, haptic, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { renderIntro } from '../../ui/intro';
import { toast } from '../../ui/toast';
import {
  LEVELS,
  METER_MAX,
  learnedFrom,
  switchStars,
  type DayEvent,
  type Dir,
  type HouseDay,
  type Level,
} from './logic';
import { SwitchScene } from './SwitchScene';
import './switch-off.css';

const LEVEL_KEY = 'switch-off-level';

const roomName = (id: string) => ROOMS.find((r) => r.id === id)?.name.toLowerCase() ?? id;

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

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "the TV", "the TV and the kettle". */
function listThings(names: string[]): string {
  const the = names.map((n) => `the ${n}`);
  if (the.length < 2) return the.join('');
  return `${the.slice(0, -1).join(', ')} and ${the.at(-1)}`;
}

/** Game resolution: container size × device pixel ratio (capped), so the canvas stays sharp. */
function gameSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    width: Math.max(320, Math.round(rect.width * dpr)),
    height: Math.max(240, Math.round(rect.height * dpr)),
  };
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const compact = isCompact();
  const params = new URLSearchParams(window.location.search);
  // Opt-in hooks for end-to-end tests (?e2e in the URL); never used in normal play.
  const e2e = params.has('e2e');
  const daySeconds = e2e ? Number(params.get('day')) : 0;
  const saved = readJSON<string>(LEVEL_KEY, 'normal');
  let level: Level = saved in LEVELS ? (saved as Level) : 'normal';
  let shownSecond = -1;
  let shownScore = -1;
  let shownMeter = -1;

  // ---------- Bill meter ----------
  const billFill = h('div', { class: 'switch-bill__fill' });
  const billValue = h('span', { class: 'switch-bill__value' }, '0%');
  const billTrack = h(
    'div',
    {
      class: 'switch-bill__track',
      role: 'meter',
      'aria-label': 'Electricity bill',
      'aria-valuemin': 0,
      'aria-valuemax': METER_MAX,
      'aria-valuenow': 0,
    },
    billFill,
  );
  const bill = h(
    'div',
    { class: 'switch-bill' },
    h('span', { class: 'switch-bill__label' }, icon('zap', { size: 14 }), 'Bill'),
    billTrack,
    billValue,
  );

  // ---------- Start screen ----------
  const options = h(
    'div',
    { class: 'intro-options' },
    h(
      'div',
      { class: 'intro-option' },
      h('span', {}, 'Level'),
      radioGroup<Level>(
        'switch-level',
        'Level',
        [
          { value: 'easy', text: 'Easy' },
          { value: 'normal', text: 'Normal' },
          { value: 'hard', text: 'Hard' },
        ],
        level,
        (v) => {
          level = v;
          writeJSON(LEVEL_KEY, v);
        },
      ),
    ),
  );
  const intro = renderIntro(ctx.game, {
    options,
    startLabel: 'Start the day',
    onStart: () => {
      ctx.sound('tap');
      newGame();
    },
  });
  const startBtn = intro.querySelector<HTMLButtonElement>('.intro__start')!;
  startBtn.disabled = true;

  const levelBtn = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change level' },
    icon('grid', { size: 18 }),
  );
  levelBtn.addEventListener('click', () => showIntro());

  const stage = h('div', {
    class: 'switch-stage',
    tabindex: '-1',
    role: 'application',
    'aria-label': 'House. Arrow keys to walk, Space to switch off.',
  });
  stage.append(intro);
  host.replaceChildren(h('div', { class: 'switch' }, bill, stage));

  function renderHud(day: HouseDay): void {
    replace(
      ctx.hud,
      h(
        'span',
        { class: 'stat switch-score' },
        icon('star', { size: 14 }),
        `${day.score}`,
        h('span', { class: 'stat__label' }, ' pts'),
      ),
      !compact &&
        day.streak >= 3 &&
        h(
          'span',
          { class: 'stat switch-streak' },
          icon('flame', { size: 14 }),
          `${day.streak}`,
          h('span', { class: 'stat__label' }, ' in a row'),
        ),
      h(
        'span',
        { class: 'stat switch-time' },
        icon('timer', { size: 14 }),
        formatTime(day.timeLeft),
        h('span', { class: 'stat__label' }, ' left'),
      ),
      !compact && levelBtn,
    );
  }

  function renderMeter(day: HouseDay): void {
    billFill.style.transform = `scaleX(${day.meter / METER_MAX})`;
    const pct = Math.round((day.meter / METER_MAX) * 100);
    if (pct === shownMeter) return;
    shownMeter = pct;
    billTrack.setAttribute('aria-valuenow', String(Math.round(day.meter)));
    billTrack.setAttribute('aria-valuetext', `${pct}% full`);
    billValue.textContent = `${pct}%`;
    bill.dataset.level = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  }

  function onChange(day: HouseDay): void {
    renderMeter(day);
    const second = Math.ceil(day.timeLeft / 1000);
    if (second !== shownSecond || day.score !== shownScore) {
      shownSecond = second;
      shownScore = day.score;
      renderHud(day);
    }
  }

  function onEvent(e: DayEvent): void {
    if (e.kind === 'on') {
      ctx.announce(
        `${e.person.name} switched on the ${e.appliance.name.toLowerCase()} in the ${roomName(e.appliance.room)}.`,
      );
    } else if (e.kind === 'left-on') {
      const things = listThings(e.appliances.map((a) => a.name.toLowerCase()));
      ctx.announce(
        `Nobody is in the ${roomName(e.room)}, but ${things} ${e.appliances.length === 1 ? 'is' : 'are'} still on.`,
      );
    } else if (e.kind === 'press') {
      const o = e.outcome;
      if (o.kind === 'off') {
        ctx.sound('good');
        ctx.announce(`You switched off the ${o.appliance.name.toLowerCase()}. +${o.points}.`);
      } else if (o.kind === 'oops') {
        ctx.sound('bad');
        haptic(60);
        toast(`${o.by.name} is using that!`, 'Only switch off things in empty rooms.');
        ctx.announce(
          `${o.by.name} is using the ${o.appliance.name.toLowerCase()}. Only switch off things in empty rooms.`,
        );
      } else if (o.kind === 'busy') {
        ctx.sound('tap');
        ctx.announce(`${o.by.name} is using the ${o.appliance.name.toLowerCase()} now.`);
      } else {
        ctx.sound('tap');
      }
    }
  }

  function onGameOver(day: HouseDay): void {
    const pct = Math.round((day.meter / METER_MAX) * 100);
    const meterFull = day.ended === 'meter';
    ctx.sound(meterFull ? 'bad' : 'win');
    if (meterFull) ctx.announce('The bill is too high!');
    const learned = learnedFrom(day).map((a) => ({ term: a.name, detail: a.tip }));
    if (learned.length === 0) learned.push({ ...ENERGY_TIPS[0]! });
    const score = day.finalScore;
    ctx.showResult({
      title: meterFull
        ? 'The bill is too high!'
        : pct <= 30 && day.switchedOff > 0
          ? 'Super energy saver!'
          : 'You made it through the day!',
      score,
      stars: switchStars(day.survived, day.meter, day.switchedOff),
      isBest: ctx.submitScore(score),
      stats: [
        `${day.switchedOff} switched off`,
        `Bill ${pct}% full`,
        `Best streak: ${day.bestStreak}`,
        ...(day.oops > 0 ? [`${day.oops} oops`] : []),
      ],
      learned,
      onReplay: newGame,
    });
  }

  const scene = new SwitchScene(
    { onChange, onEvent, onGameOver },
    {
      dark: document.documentElement.dataset.theme === 'dark',
      compact,
      reducedMotion: prefersReducedMotion(),
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      dayMs: daySeconds > 0 ? daySeconds * 1000 : undefined,
    },
  );

  // ---------- Keyboard: arrows or WASD to walk, Space/Enter/E to switch off ----------
  const held: Dir[] = [];
  const playing = () => intro.hidden && !document.querySelector('dialog[open]');
  function onKeyDown(e: KeyboardEvent): void {
    if (!playing() || e.altKey || e.ctrlKey || e.metaKey) return;
    // Leave keys alone on the bar's buttons and links (Enter on "back" must still work).
    if (e.target instanceof HTMLElement && e.target.closest('button, a, input, select')) return;
    const dir = KEY_DIRS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (dir) {
      e.preventDefault();
      if (!held.includes(dir)) held.push(dir);
      scene.heldDir = held.at(-1) ?? null;
    } else if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'e') {
      e.preventDefault();
      if (!e.repeat) scene.interact();
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

  function newGame(): void {
    intro.hidden = true;
    releaseKeys();
    shownSecond = shownScore = shownMeter = -1;
    scene.startDay(level, Math.floor(Math.random() * 2 ** 32));
    ctx.announce('The day has started. Walk into empty rooms and switch off what was left on.');
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
      scene,
    });
    if (e2e) (window as unknown as { __switch: unknown }).__switch = { scene, game };
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

  renderHud(scene.day);
  renderMeter(scene.day);

  return {
    destroy() {
      destroyed = true;
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

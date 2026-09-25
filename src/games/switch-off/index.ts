import { APPLIANCES, ENERGY_TIPS, ROOMS, type Appliance, type Room } from '../../content/energy';
import { h, haptic, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import { seededRng } from '../../core/random';
import { readJSON, writeJSON } from '../../core/storage';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { image } from '../../ui/images';
import { renderIntro } from '../../ui/intro';
import { toast } from '../../ui/toast';
import {
  HouseDay,
  LEVELS,
  MAX_MISTAKES,
  METER_MAX,
  learnedFrom,
  switchStars,
  type EndReason,
  type Level,
} from './logic';
import './switch-off.css';

const LEVEL_KEY = 'switch-off-level';

const roomOf = (a: Appliance) => ROOMS.find((r) => r.id === a.room) as Room;

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

/** "Adik", "Adik and Kakak", "Adik, Kakak and Abang". */
function listNames(names: string[]): string {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const compact = isCompact();
  const saved = readJSON<string>(LEVEL_KEY, 'normal');
  let level: Level = saved in LEVELS ? (saved as Level) : 'normal';
  let day = new HouseDay(level, seededRng(1));
  let raf = 0;
  let last = 0;
  let shownSecond = -1;
  let shownMeter = -1;
  let finishTimer: number | undefined;
  const timers = new Set<number>();

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

  // ---------- House: one room per quarter, appliances as big buttons ----------
  const buttons = new Map<string, HTMLButtonElement>();
  const roomEls = new Map<string, { el: HTMLElement; people: HTMLElement }>();
  const house = h('div', { class: 'switch-house' });
  for (const room of ROOMS) {
    const people = h('div', { class: 'switch-room__people' });
    const apps = APPLIANCES.filter((a) => a.room === room.id);
    const grid = h('div', { class: 'switch-room__apps', style: `--n:${apps.length}` });
    for (const a of apps) {
      const btn = h(
        'button',
        {
          class: 'switch-app',
          type: 'button',
          'data-id': a.id,
          onclick: () => onPress(a.id),
        },
        h('span', { class: 'switch-app__art' }, image(a.image)),
        h('span', { class: 'switch-app__name' }, a.name),
        h('span', { class: 'switch-app__state', 'aria-hidden': 'true' }),
      );
      buttons.set(a.id, btn);
      grid.appendChild(btn);
    }
    const el = h(
      'section',
      { class: 'switch-room', 'data-room': room.id, 'aria-label': room.name },
      h(
        'header',
        { class: 'switch-room__head' },
        image(room.image, { size: 26 }),
        h(
          'span',
          { class: 'switch-room__name' },
          h('strong', {}, compact ? room.shortName : room.name),
          h('small', { lang: 'ms' }, room.malay),
        ),
        people,
      ),
      h('div', { class: 'switch-room__body' }, grid),
    );
    roomEls.set(room.id, { el, people });
    house.appendChild(el);
  }
  const stage = h('div', { class: 'switch-stage' }, house);

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

  const levelBtn = h(
    'button',
    { class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': 'Change level' },
    icon('grid', { size: 18 }),
  );
  levelBtn.addEventListener('click', () => showIntro());

  host.replaceChildren(h('div', { class: 'switch' }, bill, stage, intro));

  function later(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }

  function renderHud(): void {
    const lives = MAX_MISTAKES - day.mistakes;
    const hearts = h('span', {
      class: 'stat switch-lives',
      'aria-label': `${lives} ${lives === 1 ? 'heart' : 'hearts'} left`,
    });
    for (let i = 0; i < MAX_MISTAKES; i++) {
      const heart = icon('heart', { size: 14 });
      if (i < lives) heart.classList.add('on');
      hearts.appendChild(heart);
    }
    replace(
      ctx.hud,
      h(
        'span',
        { class: 'stat switch-score' },
        icon('star', { size: 14 }),
        `${day.score}`,
        h('span', { class: 'stat__label' }, ' pts'),
      ),
      hearts,
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

  function renderMeter(): void {
    const pct = Math.round((day.meter / METER_MAX) * 100);
    billFill.style.transform = `scaleX(${day.meter / METER_MAX})`;
    if (pct === shownMeter) return;
    shownMeter = pct;
    billTrack.setAttribute('aria-valuenow', String(Math.round(day.meter)));
    billTrack.setAttribute('aria-valuetext', `${pct}% full`);
    billValue.textContent = `${pct}%`;
    bill.dataset.level = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  }

  /** Copies the day's state onto the rooms and buttons. */
  function syncHouse(): void {
    for (const room of ROOMS) {
      const parts = roomEls.get(room.id);
      if (!parts) continue;
      const inRoom = day.peopleIn(room.id);
      parts.el.classList.toggle('is-occupied', inRoom.length > 0);
      if (inRoom.length === 0) {
        replace(parts.people, h('span', { class: 'switch-room__empty' }, 'Empty'));
      } else {
        replace(
          parts.people,
          h(
            'span',
            { class: 'sr-only' },
            `${listNames(inRoom.map((p) => p.name))} ${inRoom.length === 1 ? 'is' : 'are'} here`,
          ),
          ...inRoom.map((p) =>
            h(
              'span',
              {
                class: `switch-person switch-person--${day.people.indexOf(p)}`,
                title: p.name,
                'aria-hidden': 'true',
              },
              icon('user', { size: 16, strokeWidth: 2.5 }),
              h('span', { class: 'switch-person__name' }, p.name),
            ),
          ),
        );
      }
    }
    for (const a of APPLIANCES) {
      const btn = buttons.get(a.id);
      if (!btn) continue;
      const on = day.isOn(a.id);
      const occupied = day.occupied(a.room);
      btn.dataset.on = String(on);
      btn.dataset.occupied = String(occupied);
      const state = btn.querySelector('.switch-app__state') as HTMLElement;
      replace(
        state,
        on && icon(occupied ? 'power' : 'zap', { size: 12, strokeWidth: 2.5 }),
        on ? 'On' : 'Off',
      );
      const where = roomOf(a).name.toLowerCase();
      const status = on ? (occupied ? 'on, in use' : 'on, room empty') : 'off';
      btn.setAttribute('aria-label', `${a.name}, ${where}, ${status}`);
    }
  }

  function floatPoints(btn: HTMLElement, points: number): void {
    const el = h('span', { class: 'switch-float', 'aria-hidden': 'true' }, `+${points}`);
    btn.appendChild(el);
    later(() => el.remove(), prefersReducedMotion() ? 500 : 800);
  }

  function flash(btn: HTMLElement, cls: string): void {
    btn.classList.remove(cls);
    // Restart the animation when the same button is pressed again quickly.
    void btn.offsetWidth;
    btn.classList.add(cls);
    later(() => btn.classList.remove(cls), 450);
  }

  function onPress(id: string): void {
    if (!raf) return;
    const btn = buttons.get(id);
    const outcome = day.press(id);
    if (outcome.kind === 'ignored' || !btn) {
      ctx.sound('tap');
      return;
    }
    if (outcome.kind === 'off') {
      ctx.sound('good');
      floatPoints(btn, outcome.points);
      flash(btn, 'is-done');
      const where = roomOf(outcome.appliance).name.toLowerCase();
      ctx.announce(`${outcome.appliance.name} in the ${where} switched off. +${outcome.points}.`);
    } else {
      ctx.sound('bad');
      haptic(60);
      flash(btn, 'is-wrong');
      toast('Someone’s using that!', 'Only switch off things in empty rooms.');
      const lives = MAX_MISTAKES - outcome.mistakes;
      ctx.announce(`Someone’s using that! ${lives} ${lives === 1 ? 'heart' : 'hearts'} left.`);
    }
    syncHouse();
    renderHud();
    if (day.finished) finish(day.ended as EndReason);
  }

  function frame(now: number): void {
    // Cap the step so a background tab or a slow frame doesn't skip the day ahead.
    const dt = Math.min(now - last, 250);
    last = now;
    const events = day.tick(dt);
    let moved = false;
    for (const e of events) {
      if (e.kind === 'move') {
        moved = true;
        const from = ROOMS.find((r) => r.id === e.from) as Room;
        ctx.announce(`${e.person.name} left the ${from.name.toLowerCase()}.`);
      }
    }
    if (moved) syncHouse();
    renderMeter();
    const second = Math.ceil(day.timeLeft / 1000);
    if (second !== shownSecond) {
      shownSecond = second;
      renderHud();
    }
    if (day.finished) {
      raf = 0;
      finish(day.ended as EndReason);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function stopLoop(): void {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function finish(reason: EndReason): void {
    stopLoop();
    syncHouse();
    renderMeter();
    renderHud();
    const d = day;
    const pct = Math.round((d.meter / METER_MAX) * 100);
    if (reason === 'meter') {
      ctx.sound('bad');
      ctx.announce('The bill is too high!');
    }
    const learned = learnedFrom(d).map((a) => ({ term: a.name, detail: a.tip }));
    if (learned.length === 0) learned.push({ ...(ENERGY_TIPS[0] as (typeof ENERGY_TIPS)[0]) });
    finishTimer = window.setTimeout(() => {
      if (d.survived) ctx.sound('win');
      const score = d.finalScore;
      ctx.showResult({
        title:
          reason === 'meter'
            ? 'The bill is too high!'
            : reason === 'mistakes'
              ? 'Oops, they were using those!'
              : pct <= 30
                ? 'Super energy saver!'
                : 'You made it through the day!',
        score,
        stars: switchStars(d.survived, d.meter, d.switchedOff),
        isBest: ctx.submitScore(score),
        stats: [
          `${d.switchedOff} switched off`,
          `Bill ${pct}% full`,
          `Best streak: ${d.bestStreak}`,
        ],
        learned,
        onReplay: newGame,
      });
    }, 700);
  }

  function newGame(): void {
    stopLoop();
    window.clearTimeout(finishTimer);
    intro.hidden = true;
    day = new HouseDay(level, seededRng(Math.floor(Math.random() * 2 ** 32)));
    shownSecond = -1;
    shownMeter = -1;
    syncHouse();
    renderMeter();
    renderHud();
    // Keyboard players start on the first switch; touch screens skip the focus ring.
    if (!compact) buttons.values().next().value?.focus({ preventScroll: true });
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function showIntro(): void {
    stopLoop();
    intro.hidden = false;
    intro.querySelector<HTMLElement>('.intro__start')?.focus({ preventScroll: true });
  }

  // Show a house behind the start screen so the page never looks empty.
  syncHouse();
  renderMeter();
  renderHud();
  showIntro();

  return {
    destroy() {
      stopLoop();
      window.clearTimeout(finishTimer);
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      host.replaceChildren();
    },
  };
}

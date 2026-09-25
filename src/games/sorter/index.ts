import * as Phaser from 'phaser';
import { BINS } from '../../content/waste';
import { h, replace } from '../../core/dom';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { toast } from '../../ui/toast';
import { START_LIVES, multiplierFor, sorterStars, type SorterState } from './logic';
import { SorterScene } from './SorterScene';
import './sorter.css';

/** Game resolution: container size × device pixel ratio (capped), so the canvas stays sharp. */
function gameSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(320, Math.round(rect.width * dpr));
  const height = Math.max(320, Math.round(rect.height * dpr));
  return { width, height };
}

export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  const hud = h('div', { class: 'sorter-hud' });
  const stage = h('div', { class: 'sorter-stage', tabindex: '-1' });
  const startBtn = h(
    'button',
    { class: 'btn btn--primary', type: 'button', disabled: true },
    'Loading…',
  );
  const overlay = h(
    'div',
    { class: 'sorter-overlay' },
    h(
      'div',
      { class: 'sorter-panel' },
      h('h2', {}, 'Sort the rubbish!'),
      h(
        'ul',
        { class: 'sorter-howto' },
        h(
          'li',
          {},
          icon('recycle', { size: 20 }),
          'Drag each item into the right bin before it lands.',
        ),
        h(
          'li',
          {},
          icon('sparkles', { size: 20 }),
          'Or tap a bin (or press 1–4) to send the lowest item there.',
        ),
        h(
          'li',
          {},
          icon('heart', { size: 20 }),
          `You have ${START_LIVES} lives. Sort in a row for bonus points!`,
        ),
      ),
      h(
        'ul',
        { class: 'sorter-legend', 'aria-label': 'Bins' },
        ...BINS.map((b) =>
          h(
            'li',
            { style: `--bin:#${b.color.toString(16).padStart(6, '0')}` },
            icon(b.icon, { size: 18 }),
            h('span', {}, `${b.key} · ${b.label}`),
          ),
        ),
      ),
      startBtn,
    ),
  );
  stage.appendChild(overlay);
  host.replaceChildren(
    h(
      'div',
      { class: 'sorter' },
      hud,
      stage,
      h(
        'p',
        { class: 'sorter-note' },
        'Bin rules differ from place to place. Always check what your local area accepts.',
      ),
    ),
  );

  function renderHud(state: SorterState | null): void {
    const lives = state?.lives ?? START_LIVES;
    const mult = multiplierFor(state?.streak ?? 0);
    const hearts = h('span', { class: 'stat sorter-lives', 'aria-label': `${lives} lives left` });
    for (let i = 0; i < START_LIVES; i++) {
      const heart = icon('heart', { size: 18 });
      if (i < lives) heart.classList.add('on');
      hearts.appendChild(heart);
    }
    replace(
      hud,
      h('span', { class: 'stat' }, icon('star', { size: 16 }), `${state?.score ?? 0} pts`),
      hearts,
      mult > 1 &&
        h('span', { class: 'stat sorter-combo' }, icon('flame', { size: 16 }), `×${mult} streak`),
    );
  }
  renderHud(null);

  const dark = document.documentElement.dataset.theme === 'dark';
  const scene = new SorterScene(
    {
      onChange: renderHud,
      onSort: (item, bin, outcome) => {
        if (outcome.correct) {
          ctx.sound('drop');
          ctx.announce(`${item.name}: ${bin.label}. Correct.`);
        } else {
          ctx.sound('bad');
          const right = BINS.find((b) => b.id === item.bin);
          toast(`${item.name} → ${right?.label}`, item.tip);
          ctx.announce(`Wrong bin. ${item.name} goes in ${right?.label}. ${item.tip}`);
        }
      },
      onMiss: (item) => {
        ctx.sound('bad');
        const right = BINS.find((b) => b.id === item.bin);
        toast(`${item.name} → ${right?.label}`, item.tip);
        ctx.announce(`Missed. ${item.name} goes in ${right?.label}.`);
      },
      onGameOver: (state) => {
        ctx.sound('win');
        ctx.showResult({
          title:
            state.score >= 400
              ? 'Sorting superstar!'
              : state.score >= 150
                ? 'Great sorting!'
                : 'Good effort!',
          score: state.score,
          stars: sorterStars(state.score),
          isBest: ctx.submitScore(state.score),
          stats: [`${state.sorted} sorted`, `Best streak: ${state.bestStreak}`],
          learned: state.mistakes.map((m) => ({
            term: `${m.name} → ${BINS.find((b) => b.id === m.bin)?.label}`,
            detail: m.tip,
          })),
          onReplay: start,
        });
      },
    },
    dark,
  );

  let destroyed = false;
  let game: Phaser.Game | null = null;

  function start(): void {
    overlay.hidden = true;
    ctx.sound('tap');
    scene.startRun();
    stage.focus({ preventScroll: true });
  }
  startBtn.addEventListener('click', start);

  // Wait for the UI font so canvas text renders in it, then boot Phaser.
  const fontReady = document.fonts?.load('800 16px "Nunito Variable"').catch(() => undefined);
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
      input: { activePointers: 2 },
      scene,
    });
    game.events.once(Phaser.Core.Events.READY, () => {
      startBtn.disabled = false;
      startBtn.replaceChildren('Start sorting');
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
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      game?.destroy(true);
      host.replaceChildren();
    },
  };
}

import * as Phaser from 'phaser';
import { BINS } from '../../content/waste';
import { h, haptic, isCompact, replace } from '../../core/dom';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { renderIntro } from '../../ui/intro';
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
  const compact = isCompact();
  const stage = h('div', { class: 'sorter-stage', tabindex: '-1' });
  const legend = h(
    'div',
    { class: 'sorter-legend-wrap' },
    h(
      'ul',
      { class: 'sorter-legend', 'aria-label': 'Bins' },
      ...BINS.map((b) =>
        h(
          'li',
          { style: `--bin:#${b.color.toString(16).padStart(6, '0')}` },
          icon(b.icon, { size: 16 }),
          h('span', {}, b.label),
        ),
      ),
    ),
    h('p', { class: 'sorter-note' }, 'Bin rules vary by area, so check what yours accepts.'),
  );
  const intro = renderIntro(ctx.game, {
    options: legend,
    startLabel: 'Start sorting',
    onStart: () => start(),
  });
  const startBtn = intro.querySelector<HTMLButtonElement>('.intro__start')!;
  startBtn.disabled = true;
  stage.append(intro);
  host.replaceChildren(h('div', { class: 'sorter' }, stage));

  function renderHud(state: SorterState | null): void {
    const lives = state?.lives ?? START_LIVES;
    const mult = multiplierFor(state?.streak ?? 0);
    const hearts = h('span', { class: 'stat sorter-lives', 'aria-label': `${lives} lives left` });
    for (let i = 0; i < START_LIVES; i++) {
      const heart = icon('heart', { size: 14 });
      if (i < lives) heart.classList.add('on');
      hearts.appendChild(heart);
    }
    replace(
      ctx.hud,
      h(
        'span',
        { class: 'stat sorter-score' },
        icon('star', { size: 14 }),
        `${state?.score ?? 0} pts`,
      ),
      hearts,
      mult > 1 &&
        h('span', { class: 'stat sorter-combo' }, icon('flame', { size: 14 }), `×${mult}`),
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
          haptic(60);
          const right = BINS.find((b) => b.id === item.bin);
          toast(`${item.name} → ${right?.label}`, item.tip);
          ctx.announce(`Wrong bin. ${item.name} goes in ${right?.label}. ${item.tip}`);
        }
      },
      onMiss: (item) => {
        ctx.sound('bad');
        haptic(60);
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
    { dark, compact },
  );

  let destroyed = false;
  let game: Phaser.Game | null = null;

  function start(): void {
    intro.hidden = true;
    ctx.sound('tap');
    scene.startRun();
    stage.focus({ preventScroll: true });
  }

  // Wait for the UI font so canvas text renders in it, then boot Phaser.
  const fontReady = document.fonts
    ?.load('700 16px "Plus Jakarta Sans Variable"')
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
      input: { activePointers: 2 },
      scene,
    });
    // Opt-in handle for end-to-end tests (?e2e in the URL); never used in normal play.
    if (new URLSearchParams(window.location.search).has('e2e')) {
      (window as unknown as { __sorter: unknown }).__sorter = { scene, game };
    }
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
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      game?.destroy(true);
      host.replaceChildren();
    },
  };
}

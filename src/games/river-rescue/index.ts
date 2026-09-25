import * as Phaser from 'phaser';
import { h, haptic, isCompact, prefersReducedMotion, replace } from '../../core/dom';
import type { GameContext, GameInstance } from '../../core/types';
import { icon } from '../../ui/icons';
import { renderIntro } from '../../ui/intro';
import { toast } from '../../ui/toast';
import { START_LIVES, riverLearned, riverStars, type RiverState } from './logic';
import { RiverScene } from './RiverScene';
import './river.css';

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
  const params = new URLSearchParams(window.location.search);
  // Opt-in hooks for end-to-end tests (?e2e in the URL); never used in normal play.
  const e2e = params.has('e2e');
  const tripSeconds = e2e ? Number(params.get('trip')) : 0;

  const stage = h('div', { class: 'river-stage', tabindex: '-1' });
  const intro = renderIntro(ctx.game, {
    startLabel: 'Start paddling',
    onStart: () => start(),
  });
  const startBtn = intro.querySelector<HTMLButtonElement>('.intro__start')!;
  startBtn.disabled = true;
  stage.append(intro);
  host.replaceChildren(h('div', { class: 'river' }, stage));

  function renderHud(state: RiverState | null): void {
    const lives = state?.lives ?? START_LIVES;
    const seconds = state?.secondsLeft ?? 0;
    const hearts = h('span', { class: 'stat river-lives', 'aria-label': `${lives} lives left` });
    for (let i = 0; i < START_LIVES; i++) {
      const heart = icon('heart', { size: 14 });
      if (i < lives) heart.classList.add('on');
      hearts.appendChild(heart);
    }
    replace(
      ctx.hud,
      h(
        'span',
        { class: 'stat river-score' },
        icon('star', { size: 14 }),
        `${state?.score ?? 0}`,
        h('span', { class: 'stat__label' }, ' pts'),
      ),
      hearts,
      h(
        'span',
        {
          class: `stat river-time${seconds <= 10 ? ' river-time--low' : ''}`,
          'aria-label': `${seconds} seconds left`,
        },
        icon('timer', { size: 14 }),
        `${seconds}s`,
        h('span', { class: 'stat__label' }, ' left'),
      ),
    );
  }
  renderHud(null);

  let lastAnnouncedSeconds = 0;
  const dark = document.documentElement.dataset.theme === 'dark';
  const scene = new RiverScene(
    {
      onChange: (state) => {
        renderHud(state);
        if (state.secondsLeft === 10 && lastAnnouncedSeconds !== 10 && !state.gameOver) {
          lastAnnouncedSeconds = 10;
          ctx.announce('10 seconds to the river mouth.');
        }
      },
      onCatch: (item, outcome) => {
        ctx.sound(outcome.multiplier > 1 ? 'good' : 'drop');
        ctx.announce(`${item.name} scooped up. ${outcome.points} points.`);
      },
      onBump: (item, outcome) => {
        ctx.sound('bad');
        haptic(60);
        if (outcome.firstTime) toast(item.name, item.fact);
        ctx.announce(`You bumped into the ${item.name.toLowerCase()}. ${item.fact}`);
      },
      onEscape: (item) => {
        ctx.announce(`${item.name} escaped to the sea.`);
      },
      onGameOver: (state) => {
        ctx.sound('win');
        ctx.showResult({
          title:
            state.score >= 600
              ? 'River hero!'
              : state.score >= 200
                ? 'Great paddling!'
                : state.finished
                  ? 'Trip complete!'
                  : 'Good effort!',
          score: state.score,
          stars: riverStars(state.score),
          isBest: ctx.submitScore(state.score),
          stats: [
            `${state.caught} caught`,
            `${state.escaped} escaped to sea`,
            `Best streak: ${state.bestStreak}`,
          ],
          learned: riverLearned(state),
          onReplay: start,
        });
      },
    },
    {
      dark,
      compact,
      reducedMotion: prefersReducedMotion(),
      tripMs: tripSeconds > 0 ? tripSeconds * 1000 : undefined,
    },
  );

  let destroyed = false;
  let game: Phaser.Game | null = null;

  function start(): void {
    intro.hidden = true;
    lastAnnouncedSeconds = 0;
    ctx.sound('tap');
    scene.startRun();
    ctx.announce('Paddling down Sungai Klang. Scoop up rubbish and steer around animals.');
    stage.focus({ preventScroll: true });
  }

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
      input: { activePointers: 2 },
      scene,
    });
    if (e2e) (window as unknown as { __river: unknown }).__river = { scene, game };
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

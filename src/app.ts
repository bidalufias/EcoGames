import { h } from './core/dom';
import { isMuted, onMuteChange, playSound, setMuted } from './core/sound';
import { getBest, readJSON, submitScore, writeJSON } from './core/storage';
import type { GameContext, GameDefinition, GameInstance } from './core/types';
import { findGame } from './games/registry';
import { renderHub } from './ui/hub';
import { icon } from './ui/icons';
import { showResult } from './ui/result';
import { hideToast } from './ui/toast';

type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  const saved = readJSON<Theme | null>('theme', null);
  if (saved) return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/** Parses the hash into a route. `#/play/<id>` opens a game; anything else shows the hub. */
export function parseRoute(hash: string): { name: 'hub' } | { name: 'game'; id: string } {
  const match = /^#\/play\/([a-z0-9-]+)\/?$/.exec(hash);
  return match?.[1] ? { name: 'game', id: match[1] } : { name: 'hub' };
}

export function startApp(root: HTMLElement): void {
  applyTheme(currentTheme());

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const view = h('main', { class: 'view', id: 'main', tabindex: '-1' });

  const soundBtn = h('button', { class: 'btn btn--ghost btn--icon', type: 'button' });
  const renderSoundBtn = (muted: boolean) => {
    soundBtn.replaceChildren(icon(muted ? 'volumeOff' : 'volume'));
    soundBtn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    soundBtn.setAttribute('aria-pressed', String(!muted));
  };
  renderSoundBtn(isMuted());
  onMuteChange(renderSoundBtn);
  soundBtn.addEventListener('click', () => {
    setMuted(!isMuted());
    playSound('tap');
  });

  const themeBtn = h('button', { class: 'btn btn--ghost btn--icon', type: 'button' });
  const renderThemeBtn = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeBtn.replaceChildren(icon(dark ? 'sun' : 'moon'));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  };
  renderThemeBtn();
  themeBtn.addEventListener('click', () => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writeJSON('theme', next);
    renderThemeBtn();
  });

  root.replaceChildren(
    h(
      'div',
      { class: 'shell' },
      h(
        'button',
        {
          class: 'sr-only skip-link',
          type: 'button',
          // A button rather than an #anchor, because the hash is used for routing.
          onclick: () => view.focus(),
        },
        'Skip to content',
      ),
      h(
        'header',
        { class: 'topbar' },
        h(
          'div',
          { class: 'topbar__inner' },
          h(
            'a',
            { class: 'brand', href: '#/', 'aria-label': 'EcoGames home' },
            h('span', { class: 'brand__mark' }, icon('leaf', { size: 22, strokeWidth: 2.5 })),
            h('span', { class: 'brand__name' }, 'Eco', h('span', {}, 'Games')),
          ),
          h('div', { class: 'topbar__actions' }, soundBtn, themeBtn),
        ),
      ),
      view,
      h(
        'footer',
        { class: 'footer' },
        h(
          'div',
          { class: 'footer__inner' },
          h('span', {}, 'EcoGames · Learn through play'),
          h('span', {}, 'Recycling rules vary by area: check your local council.'),
        ),
      ),
      live,
    ),
  );

  const announce = (message: string) => {
    live.textContent = '';
    // Re-set on the next frame so repeated messages are still announced.
    requestAnimationFrame(() => (live.textContent = message));
  };

  let active: GameInstance | null = null;
  let closeResult: (() => void) | null = null;
  let navToken = 0;

  const teardown = () => {
    closeResult?.();
    closeResult = null;
    active?.destroy();
    active = null;
    hideToast();
  };

  const focusHeading = () => {
    const heading = view.querySelector<HTMLElement>('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  };

  const openGame = async (game: GameDefinition, token: number) => {
    const host = h('div', { class: 'game-page__host' }, h('div', { class: 'loading' }, 'Loading…'));
    view.replaceChildren(
      h(
        'div',
        { class: `game-page accent-${game.accent}`, 'data-game': game.id },
        h(
          'div',
          { class: 'game-page__head' },
          h(
            'a',
            { class: 'btn btn--ghost btn--icon', href: '#/', 'aria-label': 'Back to all games' },
            icon('arrowLeft'),
          ),
          h('h1', {}, game.title),
        ),
        host,
      ),
    );
    document.title = `${game.title} · EcoGames`;
    focusHeading();

    let module;
    try {
      module = await game.load();
    } catch (err) {
      console.error(err);
      host.replaceChildren(
        h(
          'p',
          { class: 'loading' },
          'Sorry, this game failed to load. Check your connection and try again.',
        ),
      );
      return;
    }
    // The player may have navigated away while the game was loading.
    if (token !== navToken) return;

    const ctx: GameContext = {
      sound: playSound,
      announce,
      getBest: () => getBest(game.id),
      submitScore: (score) => submitScore(game.id, score),
      showResult: (result) => {
        closeResult?.();
        closeResult = showResult(result, () => (window.location.hash = '#/'));
      },
      exit: () => (window.location.hash = '#/'),
    };
    host.replaceChildren();
    active = module.mount(host, ctx);
  };

  const render = () => {
    const token = ++navToken;
    teardown();
    const route = parseRoute(window.location.hash);
    const game = route.name === 'game' ? findGame(route.id) : undefined;
    window.scrollTo(0, 0);
    if (game) {
      void openGame(game, token);
    } else {
      document.title = 'EcoGames · Learn through play';
      view.replaceChildren(renderHub());
      if (route.name === 'game') window.history.replaceState(null, '', '#/');
      if (token > 1) focusHeading();
    }
  };

  window.addEventListener('hashchange', render);
  render();
}

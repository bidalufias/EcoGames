import { h, replace } from './core/dom';
import { isMuted, onMuteChange, playSound, setMuted } from './core/sound';
import { getBest, readJSON, recordPlay, submitScore, writeJSON } from './core/storage';
import type { CategoryId, GameContext, GameDefinition, GameInstance } from './core/types';
import { CATEGORIES, GAMES, findCategory, findGame } from './games/registry';
import { categoryLabel, gameTile, renderHub, searchBox, type HubView } from './ui/hub';
import { icon } from './ui/icons';
import { showResult } from './ui/result';
import { hideToast } from './ui/toast';

type Theme = 'light' | 'dark';

/** Light (white) by default; dark only when the player picks it. */
function currentTheme(): Theme {
  return readJSON<Theme | null>('theme', null) === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/**
 * MGTC logo shown before the EcoGames wordmark. The official file lives at
 * public/brand/mgtc-logo.png; if it is missing the header simply shows EcoGames.
 */
function orgLogo(): HTMLElement {
  const img = h('img', {
    class: 'org-logo',
    src: './brand/mgtc-logo.png',
    alt: 'MGTC',
    width: 64,
    height: 36,
    decoding: 'async',
  });
  const wrap = h(
    'span',
    { class: 'org' },
    img,
    h('span', { class: 'org__divider', 'aria-hidden': 'true' }),
  );
  img.addEventListener('error', () => wrap.remove());
  return wrap;
}

export type Route =
  { name: 'hub'; category: CategoryId | null; query?: string } | { name: 'game'; id: string };

/**
 * Parses the hash into a route: `#/play/<id>` opens a game, `#/c/<category>`
 * filters the hub, `#/s/<query>` searches, and anything else shows the hub home.
 */
export function parseRoute(hash: string): Route {
  const game = /^#\/play\/([a-z0-9-]+)\/?$/.exec(hash);
  if (game?.[1]) return { name: 'game', id: game[1] };
  const search = /^#\/s\/(.+)$/.exec(hash);
  if (search?.[1]) {
    let query = search[1];
    try {
      query = decodeURIComponent(query);
    } catch {
      // Keep the raw text if it isn't valid URI encoding.
    }
    return { name: 'hub', category: null, query };
  }
  const cat = /^#\/c\/([a-z0-9-]+)\/?$/.exec(hash);
  const category = cat?.[1] ? findCategory(cat[1])?.id : undefined;
  return { name: 'hub', category: category ?? null };
}

/** Side navigation (desktop): search, all games and one link per category. */
function renderRail(): HTMLElement {
  const link = (
    href: string,
    iconName: Parameters<typeof icon>[0],
    label: string,
    accent: string,
  ) =>
    h(
      'a',
      { class: `rail__link accent-${accent}`, href },
      h('span', { class: 'rail__icon' }, icon(iconName, { size: 18 })),
      h('span', {}, label),
    );
  return h(
    'nav',
    { class: 'rail', 'aria-label': 'Main' },
    searchBox('', 'rail-search'),
    link('#/', 'gamepad', 'All games', 'berry'),
    ...CATEGORIES.map((c) => link(`#/c/${c.id}`, c.icon, c.label, c.accent)),
  );
}

function updateRail(rail: HTMLElement, route: Route): void {
  const current = window.location.hash || '#/';
  rail.querySelectorAll<HTMLAnchorElement>('.rail__link').forEach((a) => {
    const href = a.getAttribute('href');
    const on =
      route.name === 'hub' &&
      !route.query &&
      (href === current || (href === '#/' && current === '#'));
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const input = rail.querySelector<HTMLInputElement>('.search__input');
  const query = route.name === 'hub' ? (route.query ?? '') : '';
  if (input && document.activeElement !== input && input.value !== query) input.value = query;
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

  const rail = renderRail();
  const footer = h(
    'footer',
    { class: 'footer' },
    h('span', {}, `© ${new Date().getFullYear()} MGTC`),
    h('span', { 'aria-hidden': 'true' }, '·'),
    h('span', {}, 'EcoGames'),
  );

  root.replaceChildren(
    h(
      'div',
      { class: 'shell', id: 'shell' },
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
          'a',
          { class: 'brand', href: '#/', 'aria-label': 'MGTC EcoGames home' },
          orgLogo(),
          h('span', { class: 'brand__name' }, 'Eco', h('span', {}, 'Games')),
        ),
        h('div', { class: 'topbar__actions' }, soundBtn, themeBtn),
      ),
      h('div', { class: 'body' }, rail, h('div', { class: 'content' }, view, footer)),
      live,
    ),
  );

  const announce = (message: string) => {
    live.textContent = '';
    // Re-set on the next frame so repeated messages are still announced.
    requestAnimationFrame(() => (live.textContent = message));
  };

  let active: GameInstance | null = null;
  let hub: HubView | null = null;
  let closeResult: (() => void) | null = null;
  let navToken = 0;

  const teardown = () => {
    closeResult?.();
    closeResult = null;
    active?.destroy();
    active = null;
    hub?.destroy();
    hub = null;
    hideToast();
  };

  const focusHeading = () => {
    const heading = view.querySelector<HTMLElement>('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  };

  const openGame = async (game: GameDefinition, token: number) => {
    recordPlay(game.id);
    const host = h('div', { class: 'game-page__host' }, h('div', { class: 'loading' }, 'Loading…'));
    const hud = h('div', { class: 'gamebar__hud', role: 'group', 'aria-label': 'Score' });
    const actions = h('div', { class: 'gamebar__actions' });
    const page = h(
      'div',
      { class: `game-page accent-${game.accent}`, 'data-game': game.id },
      h(
        'div',
        { class: 'gamebar' },
        h(
          'a',
          { class: 'btn btn--ghost btn--icon', href: '#/', 'aria-label': 'Back to all games' },
          icon('arrowLeft', { size: 20 }),
        ),
        h(
          'div',
          { class: 'gamebar__title' },
          h('h1', {}, game.title),
          h('span', {}, categoryLabel(game.category)),
        ),
        hud,
        actions,
      ),
      host,
    );
    if (document.fullscreenEnabled) {
      const fs = h(
        'button',
        {
          class: 'btn btn--ghost btn--icon gamebar__fullscreen',
          type: 'button',
          'aria-label': 'Full screen',
        },
        icon('maximize', { size: 18 }),
      );
      fs.addEventListener('click', () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void page.requestFullscreen?.().catch(() => undefined);
      });
      actions.appendChild(fs);
    }
    const others = GAMES.filter((g) => g.id !== game.id);
    replace(
      view,
      page,
      others.length > 0 &&
        h(
          'section',
          { class: 'shelf more-games', 'aria-labelledby': 'more-title' },
          h('h2', { class: 'shelf__title', id: 'more-title' }, 'More games'),
          h('div', { class: 'tile-row tile-row--md' }, ...others.map((g) => gameTile(g))),
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
      game,
      hud,
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
    document.getElementById('shell')?.setAttribute('data-route', game ? 'game' : 'hub');
    // Typing in the in-page search re-renders the hub; keep the caret in the field.
    const focusedId = document.activeElement?.id;
    if (!(route.name === 'hub' && route.query)) window.scrollTo(0, 0);
    if (game) {
      void openGame(game, token);
    } else {
      document.title = 'EcoGames · Learn through play';
      hub = renderHub(route.name === 'hub' ? route : {});
      view.replaceChildren(hub.el);
      if (route.name === 'game') window.history.replaceState(null, '', '#/');
      const refocus =
        focusedId === 'hub-search' ? view.querySelector<HTMLInputElement>('#hub-search') : null;
      if (refocus) {
        refocus.focus();
        refocus.setSelectionRange(refocus.value.length, refocus.value.length);
      } else if (token > 1 && focusedId !== 'rail-search') {
        focusHeading();
      }
    }
    updateRail(rail, route);
  };

  window.addEventListener('hashchange', render);
  render();
}

import { CONCEPTS } from '../content/concepts';
import { h, prefersReducedMotion } from '../core/dom';
import { getBest, recentGames } from '../core/storage';
import type { CategoryId, GameDefinition } from '../core/types';
import {
  CATEGORIES,
  GAMES,
  featuredGames,
  findCategory,
  findGame,
  searchGames,
} from '../games/registry';
import { gameArt } from './art';
import { icon } from './icons';

/** How many games the home page carousel rotates through. */
const FEATURED = 3;

export function categoryLabel(id: CategoryId): string {
  return findCategory(id)?.label ?? '';
}

export interface HubView {
  el: HTMLElement;
  destroy: () => void;
}

export interface HubOptions {
  category?: CategoryId | null;
  query?: string;
}

/** An image-style game tile (title is part of the art), MSN Play style. */
export function gameTile(game: GameDefinition, size: 'md' | 'sm' = 'md'): HTMLElement {
  const best = getBest(game.id);
  return h(
    'a',
    {
      class: `tile tile--${size} accent-${game.accent}`,
      href: `#/play/${game.id}`,
      'data-game': game.id,
      'aria-label': `${game.title}, ${categoryLabel(game.category)}${game.isNew ? ', new' : ''}`,
    },
    gameArt(game),
    game.isNew && h('span', { class: 'tile__new' }, 'New'),
    best !== null &&
      size === 'md' &&
      h(
        'span',
        { class: 'tile__badge', title: 'Your best score' },
        icon('trophy', { size: 12 }),
        best.toLocaleString(),
      ),
  );
}

/** Big rotating "featured" card, like the carousel on MSN Play. */
function carousel(games: readonly GameDefinition[]): HubView {
  let index = 0;
  let timer: number | undefined;
  let paused = prefersReducedMotion();

  const slides = games.map((game, i) =>
    h(
      'a',
      {
        class: `carousel__slide accent-${game.accent}`,
        href: `#/play/${game.id}`,
        'aria-hidden': i === 0 ? undefined : 'true',
        tabindex: i === 0 ? undefined : '-1',
        'data-game': game.id,
      },
      gameArt(game, 'feature'),
      h(
        'span',
        { class: 'carousel__caption' },
        h('span', { class: 'carousel__icon' }, icon(game.icon, { size: 22 })),
        h(
          'span',
          { class: 'carousel__text' },
          h('span', { class: 'carousel__title' }, game.title),
          h(
            'span',
            { class: 'carousel__meta' },
            game.isNew && h('span', { class: 'carousel__new' }, 'New'),
            `${categoryLabel(game.category)} · ${game.minutes}`,
          ),
        ),
        h('span', { class: 'carousel__play' }, 'Play now'),
      ),
    ),
  );
  const dots = games.map((game, i) =>
    h('button', {
      class: 'carousel__dot',
      type: 'button',
      'aria-label': `Show ${game.title}`,
      onclick: () => show(i, true),
    }),
  );
  const pauseBtn = h('button', {
    class: 'carousel__pause',
    type: 'button',
  });
  const renderPause = () => {
    pauseBtn.replaceChildren(icon(paused ? 'play' : 'pause', { size: 12 }));
    pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
  };
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    renderPause();
    schedule();
  });
  renderPause();

  const el = h(
    'section',
    { class: 'carousel', 'aria-roledescription': 'carousel', 'aria-label': 'Featured games' },
    ...slides,
    h('div', { class: 'carousel__controls' }, pauseBtn, ...dots),
  );

  function show(i: number, user = false): void {
    index = (i + games.length) % games.length;
    slides.forEach((s, j) => {
      const on = j === index;
      s.classList.toggle('is-active', on);
      if (on) {
        s.removeAttribute('aria-hidden');
        s.removeAttribute('tabindex');
      } else {
        s.setAttribute('aria-hidden', 'true');
        s.setAttribute('tabindex', '-1');
      }
    });
    dots.forEach((d, j) => d.classList.toggle('is-active', j === index));
    if (user) schedule();
  }
  function schedule(): void {
    window.clearInterval(timer);
    if (!paused && games.length > 1) timer = window.setInterval(() => show(index + 1), 6000);
  }
  // Pause while the pointer or keyboard focus is on the carousel.
  el.addEventListener('mouseenter', () => window.clearInterval(timer));
  el.addEventListener('mouseleave', schedule);
  el.addEventListener('focusin', () => window.clearInterval(timer));
  el.addEventListener('focusout', schedule);

  show(0);
  schedule();
  return { el, destroy: () => window.clearInterval(timer) };
}

/** A "Did you know?" tile with a climate fact; tap for another. */
function factTile(): HTMLElement {
  let i = Math.floor(Math.random() * CONCEPTS.length);
  const term = h('span', { class: 'fact__term' });
  const detail = h('span', { class: 'fact__detail' });
  const render = () => {
    const c = CONCEPTS[i % CONCEPTS.length]!;
    term.textContent = c.term;
    detail.textContent = c.detail;
  };
  render();
  const btn = h(
    'button',
    { class: 'fact accent-sun', type: 'button', 'aria-live': 'polite' },
    h('span', { class: 'fact__eyebrow' }, icon('lightbulb', { size: 14 }), 'Did you know?'),
    term,
    detail,
    h('span', { class: 'fact__more' }, 'Tap for another fact', icon('arrowRight', { size: 14 })),
  );
  btn.addEventListener('click', () => {
    i++;
    render();
  });
  return btn;
}

function shelf(
  title: string,
  games: readonly GameDefinition[],
  id: string,
  size: 'md' | 'sm',
): HTMLElement {
  return h(
    'section',
    { class: 'shelf', 'aria-labelledby': id },
    h('h2', { class: 'shelf__title', id }, title),
    h('div', { class: `tile-row tile-row--${size}` }, ...games.map((g) => gameTile(g, size))),
  );
}

/** Category chips and search, shown above the content on phones and tablets. */
function mobileNav(active: CategoryId | null, query: string): HTMLElement {
  const chip = (href: string, label: string, on: boolean) =>
    h(
      'a',
      { class: `chip${on ? ' chip--on' : ''}`, href, 'aria-current': on ? 'page' : undefined },
      label,
    );
  return h(
    'div',
    { class: 'mobile-nav' },
    searchBox(query, 'hub-search'),
    h(
      'nav',
      { class: 'chips', 'aria-label': 'Game categories' },
      chip('#/', 'All games', active === null && !query),
      ...CATEGORIES.map((c) => chip(`#/c/${c.id}`, c.label, active === c.id)),
    ),
  );
}

/** Search field; typing updates the `#/s/<query>` route. */
export function searchBox(query: string, id: string): HTMLElement {
  const input = h('input', {
    class: 'search__input',
    id,
    type: 'search',
    placeholder: 'Search games',
    autocomplete: 'off',
    value: query,
  });
  input.addEventListener('input', () => {
    const q = input.value.trim();
    const next = q ? `#/s/${encodeURIComponent(q)}` : '#/';
    if (window.location.hash !== next) window.history.replaceState(null, '', next);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  return h(
    'label',
    { class: 'search' },
    icon('search', { size: 18 }),
    h('span', { class: 'sr-only' }, 'Search games'),
    input,
  );
}

export function renderHub(opts: HubOptions = {}): HubView {
  const category = opts.category ?? null;
  const query = opts.query ?? '';

  if (query) {
    const results = searchGames(query);
    return {
      el: h(
        'div',
        { class: 'hub' },
        mobileNav(null, query),
        h('h1', { class: 'page-title' }, `Results for “${query}”`),
        results.length > 0
          ? h('div', { class: 'tile-row tile-row--md' }, ...results.map((g) => gameTile(g)))
          : h('p', { class: 'empty' }, 'No games match that search yet.'),
      ),
      destroy: () => undefined,
    };
  }

  if (category) {
    return {
      el: h(
        'div',
        { class: 'hub' },
        mobileNav(category, ''),
        h('h1', { class: 'page-title' }, categoryLabel(category)),
        h(
          'div',
          { class: 'tile-row tile-row--md' },
          ...GAMES.filter((g) => g.category === category).map((g) => gameTile(g)),
        ),
      ),
      destroy: () => undefined,
    };
  }

  // MSN Play style: the carousel features a few games and the grid beside it shows
  // the next few, so the top of the page shows as many different games as it can.
  // New games come first.
  const order = featuredGames();
  const featured = carousel(order.slice(0, FEATURED));
  const recent = recentGames()
    .map(findGame)
    .filter((g): g is GameDefinition => !!g);
  const el = h(
    'div',
    { class: 'hub' },
    mobileNav(null, ''),
    h(
      'header',
      { class: 'hub__intro' },
      h('h1', { class: 'hub__title' }, 'Need a quick break?'),
      h('p', { class: 'hub__subtitle' }, 'Play quick games for the planet'),
    ),
    h(
      'div',
      { class: 'featured' },
      featured.el,
      h(
        'div',
        { class: 'featured__grid' },
        ...order.slice(FEATURED, FEATURED + 3).map((g) => gameTile(g)),
        factTile(),
      ),
    ),
    recent.length > 0 && shelf('Pick up where you left off', recent, 'recent-title', 'sm'),
    shelf('Games picked for you', GAMES, 'all-title', 'md'),
  );
  return { el, destroy: featured.destroy };
}

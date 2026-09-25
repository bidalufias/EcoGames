import { h } from '../core/dom';
import { getBest } from '../core/storage';
import { GAMES } from '../games/registry';
import type { GameDefinition } from '../core/types';
import { icon } from './icons';

function gameCard(game: GameDefinition): HTMLElement {
  const best = getBest(game.id);
  return h(
    'a',
    {
      class: `game-card accent-${game.accent}`,
      href: `#/play/${game.id}`,
      'data-game': game.id,
    },
    h('div', { class: 'game-card__art' }, icon(game.icon, { size: 72, strokeWidth: 1.75 })),
    h('h3', {}, game.title),
    h('p', { class: 'game-card__tagline' }, game.tagline),
    h(
      'div',
      { class: 'game-card__meta' },
      h('span', { class: 'tag' }, icon('timer', { size: 14 }), game.minutes),
      ...game.topics.map((t) => h('span', { class: 'tag' }, t)),
      best !== null &&
        h(
          'span',
          { class: 'tag tag--best' },
          icon('trophy', { size: 14 }),
          `${game.bestLabel}: ${best.toLocaleString()}`,
        ),
    ),
    h('span', { class: 'game-card__cta' }, 'Play now', icon('arrowRight', { size: 18 })),
  );
}

function pillar(
  accent: string,
  iconName: 'sprout' | 'users' | 'sparkles',
  title: string,
  text: string,
) {
  return h(
    'div',
    { class: `pillar accent-${accent}` },
    h('div', { class: 'pillar__icon' }, icon(iconName, { size: 22 })),
    h('div', {}, h('h3', {}, title), h('p', {}, text)),
  );
}

export function renderHub(): HTMLElement {
  const view = h(
    'div',
    { class: 'hub' },
    h(
      'section',
      { class: 'hero' },
      h('span', { class: 'hero__eyebrow' }, icon('leaf', { size: 16 }), 'Learn through play'),
      h('h1', { tabindex: '-1' }, 'Small games, ', h('em', {}, 'big ideas'), ' for our planet.'),
      h(
        'p',
        {},
        'Quick, free games about climate, energy, nature and waste. No sign-up, no downloads: play on any phone, tablet or computer.',
      ),
    ),
    h(
      'section',
      { 'aria-labelledby': 'games-title' },
      h('h2', { class: 'section-title', id: 'games-title' }, 'Choose a game'),
      h('div', { class: 'game-grid' }, ...GAMES.map(gameCard)),
    ),
    h(
      'section',
      { class: 'pillars', 'aria-label': 'About EcoGames' },
      pillar(
        'leaf',
        'sprout',
        'Real climate facts',
        'Every game is built around clear, checked facts.',
      ),
      pillar('sky', 'users', 'For all ages', 'Simple rules, big buttons, and play for one or two.'),
      pillar(
        'sun',
        'sparkles',
        'Play anywhere',
        'Phones, tablets or computers, with touch, mouse or keyboard.',
      ),
    ),
  );
  return view;
}

import { h } from '../core/dom';
import type { GameDefinition } from '../core/types';
import { icon } from './icons';

/**
 * Decorative "cover art" built from the game's icons: a big hero icon with a few
 * sticker icons on the game's accent colour. Tile art also carries the game's
 * name, like a game cover.
 */
export function gameArt(
  game: GameDefinition,
  variant: 'tile' | 'hero' | 'feature' = 'tile',
): HTMLElement {
  return h(
    'div',
    { class: `art art--${variant} accent-${game.accent}`, 'aria-hidden': 'true' },
    h('span', { class: 'art__main' }, icon(game.icon, { size: 64, strokeWidth: 1.75 })),
    ...game.art.map((name, i) =>
      h(
        'span',
        { class: `art__sticker art__sticker--${i}` },
        icon(name, { size: 24, strokeWidth: 2 }),
      ),
    ),
    variant === 'tile' && h('span', { class: 'art__title' }, game.title),
  );
}

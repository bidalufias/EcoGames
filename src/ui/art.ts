import { h } from '../core/dom';
import type { GameDefinition } from '../core/types';
import { image } from './images';

/**
 * Decorative "cover art" built from the game's 3D images: a big main image with a
 * few smaller ones around it on the game's accent colour. Tile art also carries the game's
 * name, like a game cover.
 */
export function gameArt(
  game: GameDefinition,
  variant: 'tile' | 'hero' | 'feature' = 'tile',
): HTMLElement {
  return h(
    'div',
    { class: `art art--${variant} accent-${game.accent}`, 'aria-hidden': 'true' },
    h('span', { class: 'art__main' }, image(game.image)),
    ...game.art.map((name, i) =>
      h('span', { class: `art__sticker art__sticker--${i}` }, image(name)),
    ),
    variant === 'tile' && h('span', { class: 'art__title' }, game.title),
  );
}

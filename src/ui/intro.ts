import { h, isCompact } from '../core/dom';
import type { GameDefinition } from '../core/types';
import { gameArt } from './art';
import { icon } from './icons';

interface IntroOptions {
  /** Extra controls shown above the start button, e.g. level pickers. */
  options?: HTMLElement;
  startLabel?: string;
  onStart: () => void;
}

/**
 * The shared start screen shown before a game begins: art, how to play,
 * optional settings and a big Play button. Returns the overlay element.
 */
export function renderIntro(game: GameDefinition, opts: IntroOptions): HTMLElement {
  const start = h(
    'button',
    { class: 'btn btn--primary btn--lg intro__start', type: 'button' },
    icon('play', { size: 18 }),
    opts.startLabel ?? 'Play',
  );
  start.addEventListener('click', opts.onStart);
  return h(
    'div',
    { class: `intro accent-${game.accent}` },
    h(
      'div',
      { class: 'intro__panel' },
      gameArt(game, 'hero'),
      h(
        'div',
        { class: 'intro__body' },
        h('h2', { class: 'intro__title' }, game.title),
        h(
          'ul',
          { class: 'intro__howto' },
          ...((isCompact() && game.howToMobile) || game.howTo).map((line) => h('li', {}, line)),
        ),
        opts.options ?? null,
        start,
      ),
    ),
  );
}

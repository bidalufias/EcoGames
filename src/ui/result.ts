import type { GameResult } from '../core/types';
import { h } from '../core/dom';
import { icon } from './icons';
import { confetti } from './confetti';
import { hideToast } from './toast';

/** Opens the shared end-of-game dialog. Returns a function that closes it. */
export function showResult(result: GameResult, onExit: () => void): () => void {
  const stars = h('div', {
    class: 'result__stars',
    role: 'img',
    'aria-label': `${result.stars} of 3 stars`,
  });
  for (let i = 0; i < 3; i++) {
    const star = icon('star', { size: 44 });
    if (i < result.stars) star.classList.add('on');
    stars.appendChild(star);
  }

  const replay = h(
    'button',
    { class: 'btn btn--primary', type: 'button' },
    icon('replay'),
    'Play again',
  );
  const exit = h('button', { class: 'btn', type: 'button' }, icon('gamepad'), 'All games');

  const dialog = h(
    'dialog',
    { class: 'dialog', 'aria-labelledby': 'result-title' },
    h(
      'div',
      { class: 'result' },
      stars,
      h('h2', { id: 'result-title' }, result.title),
      h(
        'div',
        {},
        h('div', { class: 'result__score' }, result.score.toLocaleString()),
        h('div', { class: 'sr-only' }, 'points'),
        result.isBest &&
          h('div', { class: 'result__best' }, icon('trophy', { size: 16 }), 'New best!'),
      ),
      result.stats.length > 0 &&
        h(
          'ul',
          { class: 'result__stats' },
          ...result.stats.map((s) => h('li', { class: 'stat' }, s)),
        ),
      result.learned.length > 0 && h('div', { class: 'result__learned-title' }, 'What you learned'),
      result.learned.length > 0 &&
        h(
          'ul',
          { class: 'result__learned' },
          ...result.learned.map((l) => h('li', {}, h('strong', {}, l.term), ': ', l.detail)),
        ),
      h('div', { class: 'result__actions' }, replay, exit),
    ),
  );

  const close = () => {
    if (dialog.open) dialog.close();
    dialog.remove();
  };
  replay.addEventListener('click', () => {
    close();
    result.onReplay();
  });
  exit.addEventListener('click', () => {
    close();
    onExit();
  });
  // Escape closes the dialog; treat that as "stay here" and leave the finished board visible.
  dialog.addEventListener('close', () => dialog.remove());

  hideToast();
  document.body.appendChild(dialog);
  dialog.showModal();
  replay.focus();
  if (result.stars >= 2) confetti();
  return close;
}

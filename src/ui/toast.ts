import { h } from '../core/dom';

let el: HTMLDivElement | null = null;
let timer: number | undefined;

/** Shows a short message at the bottom of the screen. */
export function toast(title: string, body = '', ms = 3200): void {
  if (!el) {
    el = h('div', { class: 'toast', 'aria-hidden': 'true' });
    document.body.appendChild(el);
  }
  el.replaceChildren(h('strong', {}, title), body ? ` ${body}` : '');
  el.classList.add('toast--show');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => el?.classList.remove('toast--show'), ms);
}

export function hideToast(): void {
  window.clearTimeout(timer);
  el?.classList.remove('toast--show');
}

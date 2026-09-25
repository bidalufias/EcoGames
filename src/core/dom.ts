type Child = Node | string | number | false | null | undefined;
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

/**
 * Minimal element builder: h('button', { class: 'btn', onclick: fn }, 'Play').
 * Keys starting with "on" become event listeners; boolean true sets an empty attribute.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value);
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }
  append(el, ...children);
  return el;
}

export function append(parent: Node, ...children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

/** Like `replaceChildren`, but skips false/null children (handy for conditional UI). */
export function replace(parent: Element, ...children: Child[]): void {
  parent.replaceChildren();
  append(parent, ...children);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** True on phone-sized screens, where games use their compact mobile variant. */
export function isCompact(): boolean {
  return window.matchMedia?.('(max-width: 640px), (max-height: 500px)').matches ?? false;
}

/** Short vibration for touch feedback (Android); silently ignored elsewhere. */
export function haptic(ms = 30): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not supported.
  }
}

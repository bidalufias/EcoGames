import { useEffect, useRef, useState } from 'react';

/**
 * Returns a refCallback for the parent container plus a `scale` value that
 * uniformly scales a child of fixed `naturalSize` to fit inside the parent
 * without overflowing. Use it to keep pixel-based playfields (e.g. tower
 * defence grids) playable inside the 16:9 stage on any viewport.
 *
 * Pair the returned scale with `transform: scale(${scale})` and
 * `transform-origin: 'center center'` on the inner element.
 */
export function useFitScale(naturalSize: { w: number; h: number }) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const s = Math.min(r.width / naturalSize.w, r.height / naturalSize.h, 1);
      setScale(s);
    };
    compute();
    const obs = new ResizeObserver(compute);
    obs.observe(el);
    return () => obs.disconnect();
  }, [naturalSize.w, naturalSize.h]);

  return { parentRef, scale };
}

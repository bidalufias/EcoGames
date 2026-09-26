import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

type Snap = {
  hatchling: { row: number; col: number; x: number; y: number };
  lanes: string[];
  rubbish: [number, number][];
  lights: { col: number; on: boolean; x: number; y: number }[];
  saved: number;
};

/** The scene's test snapshot, with screen points in page (CSS pixel) coordinates. */
const snapshot = (page: Page) =>
  page.evaluate(() => {
    type Hook = {
      scene: { debugSnapshot: () => Snap };
      game: { canvas: HTMLCanvasElement; scale: { width: number } };
    };
    const { scene, game } = (window as unknown as { __trek: Hook }).__trek;
    const snap = scene.debugSnapshot();
    const rect = game.canvas.getBoundingClientRect();
    const k = rect.width / game.scale.width;
    const toPage = <T extends { x: number; y: number }>(p: T) => ({
      ...p,
      x: rect.left + p.x * k,
      y: rect.top + p.y * k,
    });
    return { ...snap, hatchling: toPage(snap.hatchling), lights: snap.lights.map(toPage) };
  }) as Promise<Snap>;

/** First step of a shortest crawl to the sea, around the rubbish. */
function firstStep(s: Snap): 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' {
  const rows = s.lanes.length;
  const cols = 9;
  const blocked = new Set(s.rubbish.map(([r, c]) => `${r},${c}`));
  const start = `${s.hatchling.row},${s.hatchling.col}`;
  const prev = new Map<string, string | null>([[start, null]]);
  const queue = [[s.hatchling.row, s.hatchling.col]];
  const steps: [number, number][] = [
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, 0],
  ];
  let goal: string | null = null;
  while (queue.length && !goal) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of steps) {
      const nr = r! + dr;
      const nc = c! + dc;
      const key = `${nr},${nc}`;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || blocked.has(key) || prev.has(key))
        continue;
      prev.set(key, `${r},${c}`);
      if (nr === rows - 1) goal = key;
      queue.push([nr, nc]);
    }
  }
  let at = goal!;
  while (prev.get(at) !== start) at = prev.get(at)!;
  const [r, c] = at.split(',').map(Number);
  if (r! > s.hatchling.row) return 'ArrowDown';
  if (r! < s.hatchling.row) return 'ArrowUp';
  return c! < s.hatchling.col ? 'ArrowLeft' : 'ArrowRight';
}

test('Turtle Trek: switch off the light, crawl to the sea, and see the sun rise', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  // A calm night (no crabs) that ends after 20 seconds.
  await page.goto('./?e2e&calm&night=20');
  await page
    .getByRole('link', { name: /^Turtle Trek,/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Turtle Trek' })).toBeVisible();
  await page.getByRole('radio', { name: 'Easy' }).check();
  const start = page.getByRole('button', { name: 'Start the trek', exact: true });
  await expect(start).toBeEnabled({ timeout: 20_000 });
  await start.click();
  const hud = page.locator('.gamebar__hud');
  await expect(hud).toContainText('0/8');

  // Switch off the lit beach light: tap it on phones, press Space on a keyboard.
  const lit = (await snapshot(page)).lights.find((l) => l.on)!;
  if (isMobile) await page.touchscreen.tap(lit.x, lit.y);
  else await page.keyboard.press('Space');
  await expect.poll(async () => (await snapshot(page)).lights.every((l) => !l.on)).toBe(true);

  // Crawl down to the sea around the rubbish, one step at a time.
  for (let i = 0; i < 60 && (await snapshot(page)).saved === 0; i++) {
    const s = await snapshot(page);
    const key = firstStep(s);
    await page.keyboard.down(key);
    await expect
      .poll(
        async () => {
          const n = await snapshot(page);
          return n.hatchling.row !== s.hatchling.row || n.hatchling.col !== s.hatchling.col;
        },
        { intervals: [20] },
      )
      .toBe(true);
    await page.keyboard.up(key);
  }
  await expect(hud).toContainText('1/8');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(dialog).toContainText('safe');
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(hud).toContainText('0/8');
});

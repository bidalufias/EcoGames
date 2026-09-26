import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

interface Snapshot {
  plants: { lane: number; col: number; species: string }[];
  seedlings: number;
  houses: number;
}

const snapshot = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as { __guard: { scene: { debugSnapshot(): Snapshot } } }
    ).__guard.scene.debugSnapshot(),
  );

/** Taps (or clicks) the middle of a mudflat cell on the canvas. */
async function tapCell(page: Page, lane: number, col: number, touch: boolean) {
  const pt = await page.evaluate(
    ([l, c]) => {
      const { scene, game } = (
        window as unknown as {
          __guard: {
            scene: { debugSnapshot(): { cell(l: number, c: number): { x: number; y: number } } };
            game: { canvas: HTMLCanvasElement };
          };
        }
      ).__guard;
      const p = scene.debugSnapshot().cell(l!, c!);
      const r = game.canvas.getBoundingClientRect();
      return {
        x: r.left + (p.x * r.width) / game.canvas.width,
        y: r.top + (p.y * r.height) / game.canvas.height,
      };
    },
    [lane, col],
  );
  if (touch) await page.touchscreen.tap(pt.x, pt.y);
  else await page.mouse.click(pt.x, pt.y);
}

test('Mangrove Guard: plant mangroves and ride out the waves', async ({ page, isMobile }) => {
  // ?short: one fast ripple in each lane, then the end.
  await page.goto('./?e2e&short');
  await page
    .getByRole('link', { name: /^Mangrove Guard,/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mangrove Guard' })).toBeVisible();
  const start = page.getByRole('button', { name: 'Start planting', exact: true });
  await expect(start).toBeEnabled({ timeout: 20_000 });
  await start.click();

  const hud = page.locator('.gamebar__hud');
  await expect(hud).toContainText('5/5');
  const bakau = page.locator('.mangrove-species[data-species="bakau"]');

  if (isMobile) {
    await bakau.tap();
    await expect(bakau).toHaveAttribute('aria-pressed', 'true');
    await tapCell(page, 2, 6, true);
    await page.locator('.mangrove-species[data-species="api-api"]').tap();
    await tapCell(page, 1, 6, true);
  } else {
    // Keyboard: 2 picks bakau, Space plants at the cursor; 1 picks api-api.
    await page.keyboard.press('2');
    await expect(bakau).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await page.keyboard.press('1');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Space');
  }
  await expect
    .poll(async () => (await snapshot(page)).plants.map((p) => p.species).sort())
    .toEqual(['api-api', 'bakau']);
  // 6 seedlings to start: 4 for the bakau and 2 for the api-api.
  expect((await snapshot(page)).seedlings).toBeLessThanOrEqual(1);

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await expect(dialog).toContainText('houses dry');
  await expect(dialog).toContainText('young fish');
});

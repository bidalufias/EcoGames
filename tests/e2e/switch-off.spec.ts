import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

type Pt = { x: number; y: number };
type Snap = {
  appliances: (Pt & { id: string; on: boolean; wasted: boolean })[];
  player: Pt;
  score: number;
};

/** The scene's test snapshot, in page (CSS pixel) coordinates. */
const snapshot = (page: Page) =>
  page.evaluate(() => {
    type Hook = {
      scene: { debugSnapshot: () => Snap };
      game: { canvas: HTMLCanvasElement; scale: { width: number } };
    };
    const { scene, game } = (window as unknown as { __switch: Hook }).__switch;
    const snap = scene.debugSnapshot();
    const rect = game.canvas.getBoundingClientRect();
    const k = rect.width / game.scale.width;
    const toPage = <T extends Pt>(p: T) => ({
      ...p,
      x: rect.left + p.x * k,
      y: rect.top + p.y * k,
    });
    return { ...snap, appliances: snap.appliances.map(toPage), player: toPage(snap.player) };
  }) as Promise<Snap>;

/** Opens Switch Off! from the hub with a short test day, on Easy. */
async function start(page: Page, daySeconds: number) {
  await page.goto(`./?e2e&day=${daySeconds}`);
  await page
    .getByRole('link', { name: /^Switch Off!,/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Switch Off!' })).toBeVisible();
  await page.getByRole('radio', { name: 'Easy' }).check();
  const startBtn = page.getByRole('button', { name: 'Start the day', exact: true });
  await expect(startBtn).toBeEnabled({ timeout: 20_000 });
  await startBtn.click();
}

test('Switch Off!: walk over, switch off what was left on, and finish the day', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  await start(page, 14);
  const score = page.locator('.gamebar__hud .switch-score');
  await expect(score).toHaveText(/^0( pts)?$/);

  // Tap something left on in an empty room: the player walks over and switches it off.
  // Someone may walk in first (then nothing happens), so try the next one if needed.
  await expect(async () => {
    const snap = await snapshot(page);
    const target = snap.appliances.find((a) => a.wasted);
    expect(target).toBeDefined();
    if (isMobile) await page.touchscreen.tap(target!.x, target!.y);
    else await page.mouse.click(target!.x, target!.y);
    await expect
      .poll(async () => (await snapshot(page)).score, { timeout: 6000 })
      .toBeGreaterThan(0);
  }).toPass({ timeout: 20_000 });
  await expect(score).not.toHaveText(/^0( pts)?$/);

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(dialog).toContainText('switched off');
  await expect(dialog).toContainText('Bill');
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(score).toHaveText(/^0( pts)?$/);
});

test('Switch Off!: the arrow keys walk the player around', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard controls are for desktop');
  await start(page, 60);
  const before = (await snapshot(page)).player;
  // The player starts in the hallway, with room to walk right.
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(async () => (await snapshot(page)).player.x, { timeout: 5000 })
    .toBeGreaterThan(before.x + 40);
  await page.keyboard.up('ArrowRight');
  // Space does nothing harmful when nothing is in reach, and the page doesn't scroll.
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

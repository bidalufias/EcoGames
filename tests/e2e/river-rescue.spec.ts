import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

/** Opens a game from the hub and waits for its start button. */
async function openGame(page: Page, title: string, start = 'Play', query = '') {
  await page.goto(`./${query}`);
  await page
    .getByRole('link', { name: new RegExp(`^${title},`) })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  const startBtn = page.getByRole('button', { name: start, exact: true });
  await expect(startBtn).toBeEnabled({ timeout: 20_000 });
  return startBtn;
}

type Pt = { x: number; y: number };
type Snap = {
  items: (Pt & { kind: 'rubbish' | 'animal' })[];
  boat: Pt;
  radius: number;
  running: boolean;
  score: number;
};

/** Reads the scene through the ?e2e hook, converted to page (CSS pixel) coordinates. */
const snapshot = (page: Page) =>
  page.evaluate(() => {
    type P = { x: number; y: number };
    type Hook = {
      scene: {
        debugSnapshot: () => { items: P[]; boat: P; radius: number };
      };
      game: { canvas: HTMLCanvasElement; scale: { width: number; height: number } };
    };
    const { scene, game } = (window as unknown as { __river: Hook }).__river;
    const snap = scene.debugSnapshot();
    const rect = game.canvas.getBoundingClientRect();
    const sx = rect.width / game.scale.width;
    const sy = rect.height / game.scale.height;
    const toPage = <T extends P>(p: T) => ({
      ...p,
      x: rect.left + p.x * sx,
      y: rect.top + p.y * sy,
    });
    return {
      ...snap,
      items: snap.items.map(toPage),
      boat: toPage(snap.boat),
      radius: snap.radius * sy,
    };
  }) as Promise<Snap>;

test('River Rescue: steer the boat under rubbish, then finish the trip', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(45_000);
  // A 14-second trip (e2e only) so the run reaches the results quickly.
  const start = await openGame(page, 'River Rescue', 'Start paddling', '?e2e&trip=14');
  await start.click();
  const canvas = page.locator('.river-stage canvas');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;

  const cdp = isMobile ? await page.context().newCDPSession(page) : null;
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
    cdp!.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
    });

  // Keep steering under the lowest piece of rubbish still above the boat until one is caught.
  await expect(async () => {
    const s = await snapshot(page);
    const target = s.items
      .filter((i) => i.kind === 'rubbish' && i.y < s.boat.y - s.radius)
      .sort((a, b) => b.y - a.y)[0];
    if (target) {
      const y = box.y + box.height * 0.92;
      if (cdp) {
        // A real finger drag along the bottom of the river.
        await touch('touchStart', s.boat.x, y);
        for (let i = 1; i <= 5; i++) {
          await touch('touchMove', s.boat.x + ((target.x - s.boat.x) * i) / 5, y);
        }
        await touch('touchEnd', target.x, y);
      } else {
        await page.mouse.move(target.x, y, { steps: 5 });
      }
    }
    expect((await snapshot(page)).score).toBeGreaterThan(0);
  }).toPass({ intervals: [300], timeout: 13_000 });

  await expect(page.locator('.gamebar__hud')).toContainText(/[1-9]\d* pts/);

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog).toContainText('caught');
  await expect(dialog).toContainText('escaped to sea');
  await expect(dialog.getByText('What you learned')).toBeVisible();
});

test('River Rescue: the boat paddles with the arrow keys', async ({ page }) => {
  const start = await openGame(page, 'River Rescue', 'Start paddling', '?e2e');
  await start.click();
  await expect(page.locator('.gamebar__hud')).toContainText('60s');
  const before = (await snapshot(page)).boat.x;
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await snapshot(page)).boat.x).toBeLessThan(before - 20);
  await page.keyboard.up('ArrowLeft');
  const left = (await snapshot(page)).boat.x;
  await page.keyboard.down('d');
  await expect.poll(async () => (await snapshot(page)).boat.x).toBeGreaterThan(left + 20);
  await page.keyboard.up('d');
});

import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

async function openGame(page: Page, title: string) {
  await page.goto('./');
  await page.getByRole('link', { name: new RegExp(title) }).click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

test('hub lists every game and navigates back', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('big ideas');
  await expect(page.locator('.game-card')).toHaveCount(3);
  await openGame(page, 'Eco Quiz');
  await page.getByRole('link', { name: 'Back to all games' }).click();
  await expect(page.locator('.game-card')).toHaveCount(3);
});

test('theme toggle switches and persists', async ({ page }) => {
  await page.goto('./');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByRole('button', { name: /Switch to (dark|light) theme/ }).click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after!);
});

test('Eco Memory can be completed and saves a best score', async ({ page }) => {
  await openGame(page, 'Eco Memory');
  await page.getByRole('radio', { name: 'Easy' }).check();
  const cards = page.locator('.mem-card');
  await expect(cards).toHaveCount(12);

  // Solve the board by pairing cards with the same concept.
  const concepts = await cards.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-concept')),
  );
  const pairs = new Map<string, number[]>();
  concepts.forEach((c, i) => pairs.set(c!, [...(pairs.get(c!) ?? []), i]));
  for (const [a, b] of pairs.values()) {
    await cards.nth(a!).click();
    await cards.nth(b!).click();
  }

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('All pairs found!');
  await expect(dialog).toContainText('New best!');
  await expect(dialog.getByRole('img', { name: '3 of 3 stars' })).toBeVisible();

  await dialog.getByRole('button', { name: 'All games' }).click();
  await expect(page.locator('[data-game="eco-memory"] .tag--best')).toBeVisible();
});

test('Eco Quiz runs ten questions to a result', async ({ page }) => {
  await openGame(page, 'Eco Quiz');
  for (let i = 0; i < 10; i++) {
    await expect(page.getByText(`Question ${i + 1} of 10`)).toBeVisible();
    await page.locator('.quiz-option').first().click();
    await expect(page.locator('.quiz-feedback')).toBeVisible();
    await page.getByRole('button', { name: i === 9 ? 'See results' : 'Next question' }).click();
  }
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('correct');
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByText('Question 1 of 10')).toBeVisible();
});

test('Waste Sorter starts and ends when lives run out', async ({ page }) => {
  test.setTimeout(90_000);
  await openGame(page, 'Waste Sorter');
  const start = page.getByRole('button', { name: 'Start sorting' });
  await expect(start).toBeEnabled({ timeout: 20_000 });
  await start.click();
  await expect(page.locator('.sorter-stage canvas')).toBeVisible();
  // Keep sending items to the Recycling bin (key 1). Wrong bins and missed
  // items each cost a life, so the run ends after a few non-recyclables.
  const dialog = page.getByRole('dialog');
  await expect(async () => {
    await page.keyboard.press('1');
    await expect(dialog).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 75_000 });
  await expect(dialog).toContainText('sorted');
});

test('Waste Sorter items can be dragged into the right bin', async ({ page, isMobile }) => {
  test.setTimeout(60_000);
  await page.goto('./?e2e#/play/waste-sorter');
  const start = page.getByRole('button', { name: 'Start sorting' });
  await expect(start).toBeEnabled({ timeout: 20_000 });
  await start.click();

  type Snap = {
    items: { bin: string; x: number; y: number }[];
    bins: { id: string; x: number; y: number }[];
    score: number;
  };
  // Converts game coordinates into page (CSS pixel) coordinates.
  const snapshot = () =>
    page.evaluate(() => {
      type Pt = { x: number; y: number };
      type Hook = {
        scene: { debugSnapshot: () => { items: Pt[]; bins: Pt[]; score: number } };
        game: { canvas: HTMLCanvasElement; scale: { width: number; height: number } };
      };
      const { scene, game } = (window as unknown as { __sorter: Hook }).__sorter;
      const snap = scene.debugSnapshot();
      const rect = game.canvas.getBoundingClientRect();
      const sx = rect.width / game.scale.width;
      const sy = rect.height / game.scale.height;
      const toPage = (p: Pt) => ({
        ...p,
        x: rect.left + p.x * sx,
        y: rect.top + p.y * sy,
      });
      return { ...snap, items: snap.items.map(toPage), bins: snap.bins.map(toPage) };
    }) as Promise<Snap>;

  let snap: Snap;
  await expect(async () => {
    snap = await snapshot();
    expect(snap.items.length).toBeGreaterThan(0);
    // Wait until the item is well inside the play area, like a player would.
    const box = (await page.locator('.sorter-stage canvas').boundingBox())!;
    expect(snap.items[0]!.y).toBeGreaterThan(box.y + box.height * 0.2);
  }).toPass({ timeout: 20_000 });
  const item = snap!.items[0]!;
  const bin = snap!.bins.find((b) => b.id === item.bin)!;

  if (isMobile) {
    // Real touch events, as a phone would send them.
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      });
    await touch('touchStart', item.x, item.y);
    for (let i = 1; i <= 10; i++) {
      await touch(
        'touchMove',
        item.x + ((bin.x - item.x) * i) / 10,
        item.y + ((bin.y - item.y) * i) / 10,
      );
    }
    await touch('touchEnd', bin.x, bin.y);
  } else {
    await page.mouse.move(item.x, item.y);
    await page.mouse.down();
    await page.mouse.move(bin.x, bin.y, { steps: 10 });
    await page.mouse.up();
  }

  await expect.poll(async () => (await snapshot()).score).toBeGreaterThan(0);
  await expect(page.locator('.sorter-hud')).toContainText('10 pts');
});

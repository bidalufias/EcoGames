import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

/** Opens a game from the hub and dismisses its start screen. */
async function openGame(page: Page, title: string, start = 'Play') {
  await page.goto('./');
  await page
    .getByRole('link', { name: new RegExp(`^${title},`) })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  const startBtn = page.getByRole('button', { name: start, exact: true });
  await expect(startBtn).toBeEnabled({ timeout: 20_000 });
  return startBtn;
}

test('hub shows featured games, shelves and navigates back', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Need a quick break?');
  await expect(page.locator('.carousel__slide')).toHaveCount(3);
  await expect(page.locator('.featured__grid .tile')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Games picked for you' })).toBeVisible();
  const start = await openGame(page, 'Eco Quiz', 'Start quiz');
  await expect(start).toBeVisible();
  await page.getByRole('link', { name: 'Back to all games' }).click();
  await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toBeVisible();
  await expect(page.locator('.tile-row--sm [data-game="eco-quiz"]')).toBeVisible();
});

test('categories and search filter the games', async ({ page, isMobile }) => {
  await page.goto('./#/c/quiz');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quiz & trivia');
  await expect(page.locator('.hub .tile')).toHaveCount(1);
  await page.goto('./');
  const search = page.locator(isMobile ? '#hub-search' : '#rail-search');
  await search.fill('memory');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('memory');
  await expect(page.locator('.hub .tile')).toHaveCount(1);
  await expect(search).toBeFocused();
  await search.fill('zzz');
  await expect(page.getByText('No games match')).toBeVisible();
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
  const start = await openGame(page, 'Eco Memory');
  await page.getByRole('radio', { name: 'Easy' }).check();
  await start.click();
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
  await expect(page.locator('.tile-row--md [data-game="eco-memory"] .tile__badge')).toBeVisible();
});

test('Eco Quiz runs ten questions to a result', async ({ page }) => {
  const start = await openGame(page, 'Eco Quiz', 'Start quiz');
  await start.click();
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.quiz-count')).toHaveText(`Question ${i + 1}/10`);
    await page.locator('.quiz-option').first().click();
    await expect(page.locator('.quiz-feedback')).toBeVisible();
    await page.getByRole('button', { name: i === 9 ? 'See results' : 'Next' }).click();
  }
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('correct');
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.quiz-count')).toHaveText('Question 1/10');
});

test('Waste Sorter starts and ends when lives run out', async ({ page }) => {
  test.setTimeout(90_000);
  const start = await openGame(page, 'Waste Sorter', 'Start sorting');
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
    radius: number;
    score: number;
  };
  // Converts game coordinates into page (CSS pixel) coordinates.
  const snapshot = () =>
    page.evaluate(() => {
      type Pt = { x: number; y: number };
      type Hook = {
        scene: {
          debugSnapshot: () => { items: Pt[]; bins: Pt[]; radius: number; score: number };
        };
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
      return {
        ...snap,
        items: snap.items.map(toPage),
        bins: snap.bins.map(toPage),
        radius: snap.radius * sy,
      };
    }) as Promise<Snap>;

  // Wait until the item is well inside the play area, like a player would.
  const box = (await page.locator('.sorter-stage canvas').boundingBox())!;
  await expect(async () => {
    const s = await snapshot();
    expect(s.items[0]?.y ?? 0).toBeGreaterThan(box.y + box.height * 0.2);
  }).toPass({ timeout: 20_000 });
  // The item keeps falling while the test talks to the browser, so read its position
  // right before grabbing it, and grab its lower half: the item falls onto the pointer
  // rather than away from it.
  const snap = await snapshot();
  const item = { ...snap.items[0]!, y: snap.items[0]!.y + snap.radius * 0.6 };
  const bin = snap.bins.find((b) => b.id === item.bin)!;

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
  await expect(page.locator('.gamebar__hud')).toContainText('10 pts');
});

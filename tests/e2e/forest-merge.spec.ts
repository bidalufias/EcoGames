import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

/** Opens Grow the Forest from the hub, starting from a set 4×4 board (stages, 0 = empty). */
async function open(page: Page, stages: number[]) {
  await page.goto(`./?e2e&board=${stages.join(',')}`);
  await page
    .getByRole('link', { name: /^Grow the Forest,/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Grow the Forest' })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.forest-tile')).toHaveCount(stages.filter(Boolean).length);
}

/** Drags across the board, which slides the tiles that way. */
async function swipe(page: Page, dx: number, dy: number) {
  const box = (await page.locator('.forest-board').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2);
  await page.mouse.move(x + dx, y + dy);
  await page.mouse.up();
}

test('Grow the Forest: merging two Heart of Borneo tiles grows the Amazon and wins', async ({
  page,
}) => {
  // Two stage-10 tiles side by side; nothing else can merge.
  await open(page, [10, 10, 0, 0, 1, 2, 3, 4, 2, 1, 4, 3, 1, 2, 3, 4]);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.forest-tile--s11')).toHaveCount(1);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('You grew a whole rainforest!');
  await expect(dialog).toContainText('Best: Amazon rainforest');
  await expect(dialog.getByRole('img', { name: '3 of 3 stars' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.gamebar__hud')).toContainText(/^0/);
});

test('Grow the Forest: a swipe slides and merges the tiles', async ({ page }) => {
  await open(page, [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  await swipe(page, -160, 0);
  // The two seeds grew into a seedling (4 points), and a new seed appeared.
  await expect(page.locator('.gamebar__hud')).toContainText('4');
  await expect(page.locator('.forest-tile--s2.is-grown')).toHaveCount(1);
  await expect(page.locator('.forest-tile:not(.is-leaving)')).toHaveCount(2);
});

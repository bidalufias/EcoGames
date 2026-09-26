import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

/** Opens Green City's small town, with the first buildings fixed (?e2e&deck=). */
async function open(page: Page) {
  await page.goto('./?e2e&deck=home,park,park,home');
  await page
    .getByRole('link', { name: /^Green City,/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Green City' })).toBeVisible();
  await page.getByRole('radio', { name: 'Small (4×4)' }).check();
  await page.getByRole('button', { name: 'Start building', exact: true }).click();
}

test('Green City: build a whole town', async ({ page, isMobile }) => {
  await open(page);
  const hud = page.locator('.gamebar__hud');
  const cells = page.locator('.city-cell');
  await expect(cells).toHaveCount(16);
  await expect(hud).toContainText('1/16');

  /** Builds on a square: a click with a mouse, or a tap to preview and a tap to build. */
  const build = async (i: number) => {
    if (isMobile) {
      await cells.nth(i).tap();
      await expect(cells.nth(i).locator('.city-ghost')).toBeVisible();
      await expect(cells.nth(i)).not.toHaveClass(/is-built/);
      await cells.nth(i).tap();
    } else {
      await cells.nth(i).click();
    }
    await expect(cells.nth(i)).toHaveClass(/is-built/);
  };

  // Turn 1: a park. Turn 2: a home beside it, which scores for both.
  if (isMobile) {
    await page.locator('.city-offer').nth(1).tap();
    await build(5);
    await page.locator('.city-offer').nth(1).tap();
    await expect(page.locator('.city-offer').nth(1)).toHaveAttribute('aria-pressed', 'true');
    await build(6);
  } else {
    // Keyboard: the town opens with focus on a square; 2 picks the second building.
    await page.keyboard.press('2');
    await page.keyboard.press('Enter');
    await expect(cells.nth(8)).toHaveAttribute('data-kind', 'park');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('2');
    await expect(cells.nth(9).locator('.city-ghost__delta')).toHaveText('+2');
    await page.keyboard.press('Enter');
    await expect(cells.nth(9)).toHaveAttribute('data-kind', 'home');
  }
  await expect(hud).toContainText('2 pts');
  await expect(hud).toContainText('3/16');

  // Fill the rest of the town.
  for (let i = 0; i < 16; i++) {
    if (await cells.nth(i).evaluate((el) => el.classList.contains('is-built'))) continue;
    await build(i);
  }

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Homes by a station');
  await expect(dialog).toContainText('Small (4×4)');
});

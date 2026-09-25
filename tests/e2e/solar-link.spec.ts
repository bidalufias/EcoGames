import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

/** Opens a game from the hub and dismisses its start screen. */
async function openGame(page: Page, title: string, start = 'Play') {
  await page.goto('./?e2e');
  await page
    .getByRole('link', { name: new RegExp(`^${title},`) })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  const startBtn = page.getByRole('button', { name: start, exact: true });
  await expect(startBtn).toBeEnabled({ timeout: 20_000 });
  return startBtn;
}

/** Turns every tile the number of times its e2e hint says, which solves the puzzle. */
async function solve(page: Page) {
  const tiles = page.locator('.solar-tile');
  const turns = await tiles.evaluateAll((els) => els.map((el) => Number(el.dataset.turns)));
  for (const [i, n] of turns.entries()) {
    for (let k = 0; k < n; k++) await tiles.nth(i).click();
  }
}

test('Solar Link can be solved at par for 3 stars', async ({ page }) => {
  const start = await openGame(page, 'Solar Link');
  await page.getByRole('radio', { name: 'Easy' }).check();
  await start.click();
  const tiles = page.locator('.solar-tile');
  await expect(tiles).toHaveCount(16);
  const hud = page.locator('.gamebar__hud');
  await expect(hud).toContainText('0 turns');

  const homes = await page.locator('.solar-tile--home').count();
  await solve(page);
  await expect(hud).toContainText(`${homes}/${homes}`);
  await expect(page.locator('.solar-tile--home.is-powered')).toHaveCount(homes);

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Every home has power!');
  await expect(dialog).toContainText('Easy 4×4');
  await expect(dialog.getByRole('img', { name: '3 of 3 stars' })).toBeVisible();
  await expect(dialog).toContainText('What you learned');

  // Play again deals a new, unsolved puzzle on the same level.
  const before = await tiles.evaluateAll((els) => els.map((el) => el.dataset.turns).join());
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(dialog).toBeHidden();
  await expect(tiles).toHaveCount(16);
  await expect(hud).toContainText('0 turns');
  const after = await tiles.evaluateAll((els) => els.map((el) => el.dataset.turns).join());
  expect(after).not.toBe(before);
});

test('Solar Link tiles turn with the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard play is for desktop');
  const start = await openGame(page, 'Solar Link');
  await start.click();
  const first = page.locator('.solar-tile').first();
  await expect(first).toBeFocused();
  const label = await first.getAttribute('aria-label');
  expect(label).toMatch(/^Row 1, column 1, /);
  await page.keyboard.press('Enter');
  await expect(page.locator('.gamebar__hud')).toContainText('1 turn');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.solar-tile').nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.solar-tile').nth(5)).toBeFocused();
  await page.keyboard.press(' ');
  await expect(page.locator('.gamebar__hud')).toContainText('2 turns');
});

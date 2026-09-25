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

test('Switch Off! scores a switch-off and ends after three mistakes', async ({ page }) => {
  const start = await openGame(page, 'Switch Off!', 'Start the day');
  await page.getByRole('radio', { name: 'Easy' }).check();
  await start.click();
  await expect(page.locator('.switch-app')).toHaveCount(11);
  const score = page.locator('.gamebar__hud .switch-score');
  await expect(score).toHaveText(/^0( pts)?$/);

  // Something is always left on in an empty room at the start of the day. People
  // move every few seconds, so retry if someone walked in just before the tap.
  await expect(async () => {
    await page
      .locator('.switch-app[data-on="true"][data-occupied="false"]')
      .first()
      .click({ timeout: 1000 });
    await expect(score).not.toHaveText(/^0( pts)?$/, { timeout: 500 });
  }).toPass({ timeout: 15_000 });

  // Everyone switches something on in the room they are in, so tapping things in
  // use costs a heart; three of those end the day.
  const hearts = page.locator('.gamebar__hud .switch-lives');
  await expect(async () => {
    await page
      .locator('.switch-app[data-on="true"][data-occupied="true"]')
      .first()
      .click({ timeout: 1000 });
    await expect(hearts).toHaveAttribute('aria-label', '0 hearts left', { timeout: 300 });
  }).toPass({ timeout: 20_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Oops, they were using those!');
  await expect(dialog).toContainText('switched off');
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(score).toHaveText(/^0( pts)?$/);
});

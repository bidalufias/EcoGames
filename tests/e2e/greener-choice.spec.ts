import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

/** Opens Greener Choice from the hub (with ?e2e, which marks the greener card). */
async function open(page: Page, timer = false) {
  await page.goto('./?e2e');
  await page
    .getByRole('link', { name: /^Greener Choice,/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Greener Choice' })).toBeVisible();
  if (timer) await page.getByRole('radio', { name: 'Against the clock' }).check();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
}

test('Greener Choice: play a round to the results', async ({ page, isMobile }) => {
  await open(page);
  const hud = page.locator('.gamebar__hud');
  await expect(hud).toContainText('1/10');
  await expect(page.locator('.choice-timer')).toBeHidden();

  for (let i = 0; i < 10; i++) {
    const greener = page.locator('.choice-card[data-greener]');
    const side = Number(await greener.getAttribute('data-side'));
    // Get the first pair wrong on purpose, and the rest right.
    const pick = i === 0 ? 1 - side : side;
    if (isMobile) await page.locator(`.choice-card[data-side="${pick}"]`).click();
    else await page.keyboard.press(pick === 0 ? '1' : 'ArrowRight');

    await expect(page.locator('.choice-card.is-greener')).toHaveAttribute(
      'data-side',
      String(side),
    );
    await expect(page.locator('.choice-feedback')).toContainText(
      i === 0 ? 'Not this time' : 'Greener choice!',
    );
    // Answers are locked in once given.
    await expect(page.locator('.choice-card').first()).toBeDisabled();
    await page.getByRole('button', { name: i === 9 ? 'See results' : 'Next' }).click();
  }

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('9/10 greener picks');
  await expect(dialog).toContainText('Best streak: 9');
});

test('Greener Choice: against the clock shows a timer', async ({ page }) => {
  await open(page, true);
  await expect(page.locator('.choice-timer')).toBeVisible();
  await page.locator('.choice-card[data-greener]').click();
  await expect(page.locator('.choice-feedback')).toContainText(/Greener choice! \+1[0-5]\d/);
});

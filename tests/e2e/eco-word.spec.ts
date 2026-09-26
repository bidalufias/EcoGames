import { expect, test, type Page } from '@playwright/test';

// Fail any test that logs an uncaught error in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

const WORDS = ['TIGER', 'SOLAR', 'OZONE'];

/** Opens Eco Word from the hub with a fixed round of words. */
async function open(page: Page) {
  await page.goto(`./?e2e&words=${WORDS.join(',')}`);
  await page
    .getByRole('link', { name: /^Eco Word,/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Eco Word' })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
}

/** Types a word and enters it, on the on-screen keyboard (phones) or the real one. */
async function enter(page: Page, word: string, onScreen: boolean) {
  if (onScreen) {
    const keys = page.locator('.word-keys');
    for (const l of word) await keys.locator(`[data-key="${l}"]`).click();
    await keys.getByRole('button', { name: 'Enter' }).click();
  } else {
    await page.keyboard.type(word.toLowerCase());
    await page.keyboard.press('Enter');
  }
}

test('Eco Word: solve a round of three words', async ({ page, isMobile }) => {
  await open(page);
  const hud = page.locator('.gamebar__hud');
  await expect(hud).toContainText('1/3');

  // A made-up word is turned away and can be deleted.
  await enter(page, 'QXZVB', isMobile);
  await expect(page.locator('.word-msg')).toHaveText('Not in the word list');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');

  // A wrong guess marks the letters; the right one solves the word.
  await enter(page, 'TIRED', isMobile);
  // T, I and E are in place; R is in the word somewhere else.
  await expect(page.locator('.word-row').first().locator('.is-correct')).toHaveCount(3);
  await expect(page.locator('.word-row').first().locator('.is-present')).toHaveCount(1);
  await expect(page.locator('.word-key[data-key="T"]')).toHaveClass(/is-correct/);

  for (const [i, word] of WORDS.entries()) {
    await enter(page, word, isMobile);
    const reveal = page.locator('.word-reveal');
    await expect(reveal).toBeVisible();
    await expect(reveal).toContainText('Solved!');
    await expect(reveal).toContainText(word);
    await reveal.getByRole('button', { name: i < 2 ? 'Next word' : 'See results' }).click();
    if (i < 2) await expect(hud).toContainText(`${i + 2}/3`);
  }

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('All three words solved!');
  await expect(dialog).toContainText('3/3 words');
  await expect(dialog.getByRole('img', { name: '3 of 3 stars' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(hud).toContainText('1/3');
});

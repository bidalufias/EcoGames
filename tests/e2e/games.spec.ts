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

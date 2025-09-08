import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:3100';

test('has title', async ({ page }) => {
  await page.goto(BASE_URL);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Sophon Account via EIP-6963/);
});

test('get started link', async ({ page }) => {
  await page.goto(BASE_URL);

  // Click the get started link.
  await page.getByTestId('connect-button').click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByText('Connected to Sophon')).toBeVisible();
});

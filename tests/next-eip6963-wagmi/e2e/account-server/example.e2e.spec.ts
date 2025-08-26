import { expect, test } from '../support/test-server/context';

test('get started link', async ({ page, testServerPage }) => {
  // given
  const email = process.env.USER_EMAIL as string;
  const otp = process.env.USER_OTP as string;

  // when
  await testServerPage.gotoHome();
  const loginPage = await testServerPage.clickLoginButton();

  // account server
  const authorizationPage = await loginPage.login(email, otp);
  await authorizationPage.authorizeConnection();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByText('Connected to Sophon')).toBeVisible();
});

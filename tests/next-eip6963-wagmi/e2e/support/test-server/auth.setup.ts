import path from 'node:path';
import { expect, test as setup } from './context';

const authFile = path.join(__dirname, '../../../playwright/.auth/user.json');

setup('authenticate', async ({ page, testServerPage }) => {
  // given
  const email = process.env.USER_EMAIL as string;
  const otp = process.env.USER_OTP as string;

  // when
  await testServerPage.gotoHome();
  const loginPage = await testServerPage.clickLoginButton();

  // account server
  const authorizationPage = await loginPage.login(email, otp);
  await authorizationPage.authorizeConnection();

  // confirm to be connected before running tests
  await expect(page.getByText('Status: Connected')).toBeVisible();
  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});

import { safeStringify } from '../../lib/utils';
import { accountServerTestCases, directCallTestCases } from '../functions';
import { expect, test } from '../support/test-server/context';

test.beforeEach(async ({ page, testServerPage }) => {
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
});

[accountServerTestCases.map((testCase) => testCase.name)].forEach(
  (testCaseName) => {
    test(`Account Server: should be able execute ${testCaseName}`, async ({
      page,
      testServerPage,
      context,
    }) => {
      await testServerPage.gotoHome();

      for (const testCase of accountServerTestCases) {
        const commandPagePromise = context.waitForEvent('page');
        const executeCommandPromise = page.evaluate(
          async (data) => {
            return await window.executeWagmiAction(data.method, data.payload);
          },
          {
            method: testCase.method,
            payload: testCase.payload,
          },
        );

        const commandPage = await commandPagePromise;
        await testCase.accountServerActions(commandPage);

        const response = await executeCommandPromise;
        console.log(`${testCaseName} response: ${safeStringify(response)}`);
        // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
        expect((testCase as any).isValidResponse(response)).toBe(true);
      }
    });
  },
);

[directCallTestCases.map((testCase) => testCase.name)].forEach(
  (testCaseName) => {
    test(`Direct Access: should be able execute ${testCaseName}`, async ({
      page,
      testServerPage,
    }) => {
      await testServerPage.gotoHome();

      for (const testCase of directCallTestCases) {
        const response = await page.evaluate(
          async (data) => {
            return await window.executeWagmiAction(data.method, data.payload);
          },
          {
            method: testCase.method,
            payload: testCase.payload,
          },
        );

        console.log(`${testCaseName} response: ${safeStringify(response)}`);
        // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
        expect((testCase as any).isValidResponse(response)).toBe(true);
      }
    });
  },
);

import { safeStringify } from '../../lib/utils';
import { accountServerTestCases, directCallTestCases } from '../functions';
import { expect, test } from '../support/test-server/context';

[
  ...accountServerTestCases.map((testCase) => ({
    testName: testCase.name,
    testCase,
  })),
].forEach(({ testName, testCase }) => {
  test(`Account Server: should be able execute ${testName}`, async ({
    page,
    testServerPage,
    context,
  }) => {
    await testServerPage.gotoHome();

    const commandPagePromise = context.waitForEvent('page');
    const executeCommandPromise = page.evaluate(
      async (data) => {
        return await window.executeEthersAction(data.method, data.payload);
      },
      {
        method: testCase.method,
        payload: testCase.payload,
      },
    );

    const commandPage = await commandPagePromise;
    await testCase.accountServerActions(commandPage);

    const response = await executeCommandPromise;
    console.log(
      `call: ${testCase.name} - response: ${safeStringify(response)}`,
    );
    // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
    expect((testCase as any).isValidResponse(response)).toBe(true);
  });
});

[
  ...directCallTestCases.map((testCase) => ({
    testName: testCase.name,
    testCase,
  })),
].forEach(({ testName, testCase }) => {
  test(`Direct Access: should be able execute ${testName}`, async ({
    page,
    testServerPage,
  }) => {
    await testServerPage.gotoHome();

    const response = await page.evaluate(
      async (data) => {
        return await window.executeEthersAction(data.method, data.payload);
      },
      {
        method: testCase.method,
        payload: testCase.payload,
      },
    );

    console.log(
      `call: ${testCase.name} - response: ${safeStringify(response)}`,
    );
    // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
    expect((testCase as any).isValidResponse(response)).toBe(true);
  });
});

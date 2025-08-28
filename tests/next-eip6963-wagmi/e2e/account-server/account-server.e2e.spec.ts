import { parseEther } from 'viem';
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
        return await window.executeWagmiAction(data.method, data.payload);
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

test.skip(`Account Server: should be able execute signTransaction and send it via eth_sendRawTransaction`, async ({
  page,
  testServerPage,
  context,
}) => {
  await testServerPage.gotoHome();

  const transactionRequest = {
    to: process.env.TRANSFER_TARGET_WALLET as `0x${string}`,
    value: parseEther('0.1'),
  };

  // Signature flow
  const commandPagePromise = context.waitForEvent('page');
  const executeCommandPromise = page.evaluate(async (data) => {
    return await window.signTransaction(data);
  }, transactionRequest);

  const commandPage = await commandPagePromise;

  await commandPage
    .locator('text=Signature Request')
    .waitFor({ state: 'visible' });
  await commandPage.screenshot();
  await commandPage.getByTestId('signing-accept-button').click();

  const response = await executeCommandPromise;

  console.log(`Transaction Signature Response: ${safeStringify(response)}`);
});

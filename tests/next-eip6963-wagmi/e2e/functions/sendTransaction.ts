import { parseEther } from 'viem';
import type { AccountServerTestCase } from './types';

export const sendTransactionSOPTestCase: AccountServerTestCase<'sendTransaction'> =
  {
    name: 'sendTransaction-soph',
    method: 'sendTransaction',
    payload: {
      to: process.env.TRANSFER_TARGET_WALLET as `0x${string}`,
      value: parseEther('0.01'),
      data: '0x',
    },
    accountServerActions: async (page) => {
      await page
        .locator('text=Transaction Request')
        .waitFor({ state: 'visible' });
      await page.screenshot();
      await page.getByTestId('transaction-accept-button').click();
    },
    isValidResponse: (response) => {
      return response.startsWith('0x');
    },
  };

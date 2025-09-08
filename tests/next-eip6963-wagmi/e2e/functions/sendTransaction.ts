import { encodeFunctionData, erc20Abi, parseEther, parseUnits } from 'viem';
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
      await page.locator('text=Transfer SOPH').waitFor({ state: 'visible' });
      await page.screenshot();
      await page.getByTestId('transaction-accept-button').click();
    },
    isValidResponse: (response) => {
      return response.startsWith('0x');
    },
  };

export const sendTransactionAsFunctionCallTestCase: AccountServerTestCase<'sendTransaction'> =
  {
    name: 'sendTransaction-encoded-function-call',
    method: 'sendTransaction',
    payload: {
      to: process.env.NEXT_PUBLIC_TOKEN_ERC20_TOKEN as `0x${string}`,
      data: encodeFunctionData({
        abi: [
          ...erc20Abi,
          {
            inputs: [
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'mint',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'mint',
        args: [parseUnits('10', 18)],
      }),
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

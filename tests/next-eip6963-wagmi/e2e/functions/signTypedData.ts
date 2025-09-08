import { sophonTestnet } from 'wagmi/chains';
import type { AccountServerTestCase } from './types';

export const signTypedDataTestCase: AccountServerTestCase<'signTypedData'> = {
  name: 'signTypedData-call',
  method: 'signTypedData',
  payload: {
    domain: {
      name: 'Sophon SSO',
      version: '1',
      chainId: sophonTestnet.id,
    },
    types: {
      Message: [
        { name: 'content', type: 'string' },
        { name: 'from', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
      ],
    },
    primaryType: 'Message',
    message: {
      content: `Hello from Sophon SSO!\n\nThis message confirms you control this wallet.`,
      from: process.env.USER_WALLET as `0x${string}`,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    },
  },
  accountServerActions: async (page) => {
    await page.locator('text=Signature Request').waitFor({ state: 'visible' });
    await page.screenshot();
    await page.getByTestId('signing-accept-button').click();
  },
  isValidResponse: (response) => {
    return response?.startsWith('0x');
  },
};

import type { AccountServerTestCase } from './types';

export const signMessageTestCase: AccountServerTestCase = {
  name: 'signMessage',
  payload: { message: 'Hello, world!' } as const,
  accountServerActions: async (page) => {
    await page.locator('text=Signature Request').waitFor({ state: 'visible' });
    await page.screenshot();
    await page.getByTestId('signing-accept-button').click();
  },
  isValidResponse: (response) => {
    if (!response) return false;
    if (typeof response !== 'string') return false;
    return response.startsWith('0x');
  },
};

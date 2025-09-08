import type { AccountServerTestCase } from './types';

export const signMessageTestCase: AccountServerTestCase<'signMessage'> = {
  name: 'signMessage-call',
  method: 'signMessage',
  payload: { message: 'Hello, world!' },
  accountServerActions: async (page) => {
    await page.locator('text=Signature Request').waitFor({ state: 'visible' });
    await page.screenshot();
    await page.getByTestId('signing-accept-button').click();
  },
  isValidResponse: (response) => {
    return response?.startsWith('0x');
  },
};

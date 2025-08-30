import type { AccountServerTestCase } from './types';

export const getBalanceTestCase: AccountServerTestCase<'getBalance'> = {
  name: 'getBalance-call',
  method: 'getBalance',
  payload: { address: process.env.USER_WALLET as `0x${string}` },
  accountServerActions: async () => {},
  isValidResponse: (response) => {
    return response > BigInt(0);
  },
};

import type { TestCase } from './types';

export const getTransactionCountTestCase: TestCase<'getTransactionCount'> = {
  name: 'getTransactionCount-call',
  method: 'getTransactionCount',
  payload: {
    address: process.env.USER_WALLET as `0x${string}`,
  },
  isValidResponse: (response) => {
    return response > BigInt(0);
  },
};

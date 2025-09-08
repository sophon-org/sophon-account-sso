import type { AccountServerTestCase } from './types';

export const getTransactionReceiptTestCase: AccountServerTestCase<'getTransactionReceipt'> =
  {
    name: 'getTransactionReceipt-call',
    method: 'getTransactionReceipt',
    payload: {
      hash: process.env.USER_TRANSACTION as `0x${string}`,
    },
    accountServerActions: async () => {},
    isValidResponse: (response) => {
      return response.transactionHash === process.env.USER_TRANSACTION;
    },
  };

import type { AccountServerTestCase } from './types';

export const getTransactionByHashTestCase: AccountServerTestCase<'getTransaction'> =
  {
    name: 'getTransaction-byHash',
    method: 'getTransaction',
    payload: {
      hash: process.env.USER_TRANSACTION as `0x${string}`,
    },
    accountServerActions: async () => {},
    isValidResponse: (response) => {
      return response.hash === process.env.USER_TRANSACTION;
    },
  };

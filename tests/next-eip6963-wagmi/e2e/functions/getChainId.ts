import type { AccountServerTestCase } from './types';

export const getChainIdTestCase: AccountServerTestCase = {
  name: 'getChainId',
  payload: undefined,
  accountServerActions: async () => {},
  isValidResponse: (response) => {
    return response === 531050104;
  },
};

import type { AccountServerTestCase } from './types';

export const getChainIdTestCase: AccountServerTestCase<'getChainId'> = {
  name: 'getChainId-call',
  method: 'getChainId',
  payload: undefined,
  accountServerActions: async () => {},
  isValidResponse: (response) => {
    return response === 531050104;
  },
};

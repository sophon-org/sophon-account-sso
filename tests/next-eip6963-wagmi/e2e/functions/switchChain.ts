import type { AccountServerTestCase } from './types';

export const switchChainTestCase: AccountServerTestCase = {
  name: 'switchChain',
  payload: {
    chainId: 531050104,
  },
  accountServerActions: async () => {},
  isValidResponse: (response) => {
    const typedResponse = response as { id: number };
    return typedResponse.id === 531050104;
  },
};

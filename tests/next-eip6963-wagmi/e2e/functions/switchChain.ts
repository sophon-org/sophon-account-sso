import type { TestCase } from './types';

export const switchChainTestCase: TestCase<'switchChain'> = {
  name: 'switchChain-call',
  method: 'switchChain',
  payload: {
    chainId: 531050104,
  },
  isValidResponse: (response) => {
    return response?.id === 531050104;
  },
};

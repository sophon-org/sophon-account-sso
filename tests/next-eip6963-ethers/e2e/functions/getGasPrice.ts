import type { TestCase } from './types';

export const getGasPriceTestCase: TestCase<'getGasPrice'> = {
  name: 'getGasPrice-call',
  method: 'getGasPrice',
  payload: undefined,
  isValidResponse: (response) => {
    return response > BigInt(0);
  },
};

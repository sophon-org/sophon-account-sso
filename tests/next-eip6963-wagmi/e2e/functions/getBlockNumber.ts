import type { TestCase } from './types';

export const getBlockNumberTestCase: TestCase<'getBlockNumber'> = {
  name: 'getBlockNumber-call',
  method: 'getBlockNumber',
  payload: undefined,
  isValidResponse: (response) => {
    return response > 0;
  },
};

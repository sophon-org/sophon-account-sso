import { parseEther } from 'viem';
import type { AccountServerTestCase } from './types';

export const estimateGasSimpleTestCase: AccountServerTestCase<'estimateGas'> = {
  name: 'estimateGas-simple',
  method: 'estimateGas',
  payload: {
    to: process.env.TRANSFER_TARGET_WALLET as `0x${string}`,
    value: parseEther('0.01'),
    data: '0x',
  },
  accountServerActions: async () => {},
  isValidResponse: (response) => {
    return response > 0;
  },
};

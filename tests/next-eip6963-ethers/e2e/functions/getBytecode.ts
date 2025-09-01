import type { AccountServerTestCase } from './types';

export const getBytecodeTestCase: AccountServerTestCase<'getBytecode'> = {
  name: 'getBytecode-call',
  method: 'getBytecode',
  payload: {
    address: process.env.NEXT_PUBLIC_NFT_ADDRESS as `0x${string}`,
  },
  accountServerActions: async () => {},
  isValidResponse: (response) => {
    return !!response && response?.startsWith('0x');
  },
};

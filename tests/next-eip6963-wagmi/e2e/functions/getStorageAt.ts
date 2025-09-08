import type { AccountServerTestCase } from './types';

export const getStorageAtTestCase: AccountServerTestCase<'getStorageAt'> = {
  name: 'getStorageAt-call',
  method: 'getStorageAt',
  payload: {
    address: process.env.NEXT_PUBLIC_NFT_ADDRESS as `0x${string}`,
    slot: '0x0',
  },
  accountServerActions: async () => {},
  isValidResponse: (response) => {
    return !!response && response?.startsWith('0x');
  },
};

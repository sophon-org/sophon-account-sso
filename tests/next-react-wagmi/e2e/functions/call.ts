import { encodeFunctionData, parseAbi } from 'viem';
import type { AccountServerTestCase } from './types';

export const callTestCase: AccountServerTestCase<'call'> = {
  name: 'call-simple',
  method: 'call',
  payload: {
    account: process.env.USER_WALLET as `0x${string}`,
    to: process.env.NEXT_PUBLIC_NFT_ADDRESS as `0x${string}`,
    data: encodeFunctionData({
      abi: parseAbi([
        'function balanceOf(address owner) public view returns (uint256)',
      ]),
      functionName: 'balanceOf',
      args: [process.env.USER_WALLET as `0x${string}`],
    }),
  },
  accountServerActions: async () => {},
  isValidResponse: (response) => {
    return !!response?.data && response.data?.startsWith('0x');
  },
};

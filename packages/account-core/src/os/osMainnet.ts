import { defineChain } from 'viem';

export const sophonOS = defineChain({
  id: 5010405,
  name: 'Sophon OS',
  nativeCurrency: {
    decimals: 18,
    name: 'Sophon',
    symbol: 'SOPH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sophon.xyz'],
      webSocket: ['wss://rpc.sophon.xyz/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Sophon OS Block Explorer',
      url: 'https://explorer.sophon.xyz',
    },
  },
  contracts: {
    multicall3: {
      // TODO: provide correct values once deployed
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1468,
    },
  },
  testnet: false,
});

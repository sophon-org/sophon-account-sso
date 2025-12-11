import { defineChain } from 'viem';

export const sophonOSTestnet = defineChain({
  id: 531050204,
  name: 'Sophon OS Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sophon',
    symbol: 'SOPH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.os.sophon.com'],
      webSocket: ['wss://rpc.testnet.os.sophon.com/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Sophon OS Testnet Block Explorer',
      url: 'https://explorer.testnet.os.sophon.com',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1468,
    },
  },
  testnet: true,
});

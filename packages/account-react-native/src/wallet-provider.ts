import { WalletProvider } from 'zksync-sso';
import { WebViewCommunicator } from './webview-communicator';
import { sophonTestnet } from 'viem/chains';
import { http } from 'viem';
import { syncStorage } from './storage';
import type { FlowController } from './flow-controller';

syncStorage.init();

export const createWalletProvider = (flow: typeof FlowController) => {
  console.log('creating wallet provider', flow.webView);
  return new WalletProvider({
    metadata: {
      name: 'Sophon SSO',
      icon: '/sophon-icon.png',
      // configData: parameters.metadata?.configData,
    },
    authServerUrl: 'http://localhost:3000',
    //   session: parameters.session,
    //   transports: config.transports,
    transports: {
      [sophonTestnet.id]: http(),
    },
    chains: [sophonTestnet],
    paymasterHandler: async () => ({
      paymaster: '0x98546B226dbbA8230cf620635a1e4ab01F6A99B2',
      paymasterInput: '0x',
    }),
    customCommunicator: new WebViewCommunicator(flow),
    storage: syncStorage,
  });
};

// export const SophonWalletProvider = new WalletProvider({
//   metadata: {
//     name: 'Sophon SSO',
//     icon: '/sophon-icon.png',
//     // configData: parameters.metadata?.configData,
//   },
//   authServerUrl: 'http://localhost:3000',
//   //   session: parameters.session,
//   //   transports: config.transports,
//   transports: {
//     [sophonTestnet.id]: http(),
//   },
//   chains: [sophonTestnet],
//   paymasterHandler: async () => ({
//     paymaster: '0x98546B226dbbA8230cf620635a1e4ab01F6A99B2',
//     paymasterInput: '0x',
//   }),
//   customCommunicator: new WebViewCommunicator(),
//   storage: syncStorage,
// });

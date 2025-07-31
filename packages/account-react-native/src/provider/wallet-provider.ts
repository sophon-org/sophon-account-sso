import { type Chain, http } from 'viem';
import { WalletProvider } from 'zksync-sso';
import { SophonAppStorage } from './storage';
import { WebViewCommunicator } from './webview-communicator';

export const createWalletProvider = (authServerUrl: string, chain: Chain) => {
  console.log('creatign wallet provider', authServerUrl, chain.id);
  const provider = new WalletProvider({
    metadata: {
      name: 'Sophon Wallet',
      icon: '/sophon-icon.png',
      // configData: parameters.metadata?.configData,
    },
    authServerUrl,
    //   session: parameters.session,
    //   transports: config.transports,
    transports: {
      [chain.id]: http(),
    },
    chains: [chain],
    // paymasterHandler: async () => ({
    //   paymaster: '0x98546B226dbbA8230cf620635a1e4ab01F6A99B2',
    //   paymasterInput: '0x',
    // }),
    customCommunicator: new WebViewCommunicator(),
    storage: SophonAppStorage,
  });

  provider.on('disconnect', () => {
    console.log('⭐️ ⭐️ ⭐️ ⭐️ ⭐️ disconnected');
    SophonAppStorage.clear();
  });

  return provider;
};

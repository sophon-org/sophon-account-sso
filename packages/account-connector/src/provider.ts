import type { SophonNetworkType } from '@sophon-labs/account-core';
import { http } from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { type ProviderInterface, WalletProvider } from 'zksync-sso';
import type { ZksyncSsoConnectorOptions } from 'zksync-sso/connector';
import { genericRPCHandler } from './genericRPC';

export const createDelegateProvider = (
  network: SophonNetworkType,
  params: ZksyncSsoConnectorOptions,
): ProviderInterface => {
  const ssoProvider = new WalletProvider({
    metadata: {
      name: params.metadata?.name,
      icon: params.metadata?.icon,
      configData: params.metadata?.configData,
    },
    authServerUrl: params.authServerUrl,
    session: params.session,
    transports: {
      [sophon.id]: http(),
      [sophonTestnet.id]: http(),
    },
    chains: [network === 'mainnet' ? sophon : sophonTestnet],
    paymasterHandler: params.paymasterHandler,
    customCommunicator: params.communicator,
  }) as ProviderInterface;

  return {
    request: async (args) => {
      const { method, params } = args;
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
        case 'eth_chainId':
        case 'wallet_switchEthereumChain':
        case 'personal_sign':
        case 'eth_signTypedData_v4':
        case 'eth_sendTransaction':
        case 'wallet_revokePermissions':
        case 'wallet_requestPermissions':
          return ssoProvider.request(args);
      }

      // passthrough methods to the RPC client, no need for sending them to the account server
      // we can do common RPC call here
      console.log('RPC passthrough method:', method, params);
      return await genericRPCHandler(network).request(method, params);
    },
    disconnect: ssoProvider.disconnect.bind(ssoProvider),
    getClient: ssoProvider.getClient.bind(ssoProvider),
    on: ssoProvider.on.bind(ssoProvider),
    removeListener: ssoProvider.removeListener.bind(ssoProvider),
    eventNames: ssoProvider.eventNames.bind(ssoProvider),
    listeners: ssoProvider.listeners.bind(ssoProvider),
    listenerCount: ssoProvider.listenerCount.bind(ssoProvider),
    emit: ssoProvider.emit.bind(ssoProvider),
    addListener: ssoProvider.addListener.bind(ssoProvider),
    once: ssoProvider.once.bind(ssoProvider),
    off: ssoProvider.off.bind(ssoProvider),
    removeAllListeners: ssoProvider.removeAllListeners.bind(ssoProvider),
  };
};

import { createSophonEIP1193Provider } from '@sophon-labs/account-provider';
import type { Chain } from 'viem';
import { sophon } from 'viem/chains';
import { SophonAppStorage } from './storage';
import { WebViewCommunicator } from './webview-communicator';

export const createWalletProvider = (authServerUrl: string, chain: Chain) => {
  const provider = createSophonEIP1193Provider(
    chain.id === sophon.id ? 'mainnet' : 'testnet',
    undefined,
    authServerUrl,
    new WebViewCommunicator(),
    SophonAppStorage,
  );

  provider.on('disconnect', () => {
    SophonAppStorage.clear();
  });

  return provider;
};

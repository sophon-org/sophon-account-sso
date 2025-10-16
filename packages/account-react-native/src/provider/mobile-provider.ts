import { createSophonEIP1193Provider } from '@sophon-labs/account-provider';
import type { Chain } from 'viem';
import { sophon } from 'viem/chains';
import { MobileCommunicator } from './mobile-communicator';
import { SophonAppStorage } from './storage';

export const createMobileProvider = (authServerUrl: string, chain: Chain) => {
  const provider = createSophonEIP1193Provider(
    chain.id === sophon.id ? 'mainnet' : 'testnet',
    undefined,
    authServerUrl,
    new MobileCommunicator(),
    SophonAppStorage,
    true,
  );

  provider.on('disconnect', () => {
    SophonAppStorage.clear();
  });

  return provider;
};

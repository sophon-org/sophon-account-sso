import type { ChainId } from '@sophon-labs/account-core';
import { createSophonEIP1193Provider } from '@sophon-labs/account-provider';
import { MobileCommunicator } from './mobile-communicator';
import { SophonAppStorage } from './storage';

export const createMobileProvider = (
  authServerUrl: string,
  chainId: ChainId,
) => {
  const provider = createSophonEIP1193Provider(
    chainId,
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

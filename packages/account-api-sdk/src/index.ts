import type { SophonNetworkType } from '@sophon-labs/account-core';
import { AuthAPIWrapper } from './auth';

export * from './auth';
export * from './constants';

export const SophonAPISDK = (network: SophonNetworkType, partnerId: string) => {
  return {
    auth: new AuthAPIWrapper(network, partnerId),
  };
};

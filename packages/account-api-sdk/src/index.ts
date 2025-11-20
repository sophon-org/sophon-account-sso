import type { ChainId } from '@sophon-labs/account-core';
import { AuthAPIWrapper } from './auth';

export * from './auth';

export const SophonAPISDK = (chainId: ChainId, partnerId: string) => {
  return {
    auth: new AuthAPIWrapper(chainId, partnerId),
  };
};

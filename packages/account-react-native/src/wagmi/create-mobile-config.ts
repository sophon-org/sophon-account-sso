import {
  type ChainId,
  sophonOS,
  sophonOSTestnet,
} from '@sophon-labs/account-core';
import { type Chain, sophon, sophonTestnet } from 'viem/chains';
import { createConfig, createStorage, http } from 'wagmi';
import { SophonAppStorage } from '../provider/storage';

export interface CreateMobileConfigParams {
  chainId?: ChainId;
  chains?: readonly [Chain, ...Chain[]];
}

/**
 * Creates a wagmi config optimized for React Native environments
 * @param chains - Optional custom chains array (defaults to all Sophon chains)
 * @returns Configured wagmi config for React Native
 */
export function createMobileConfig({
  chains = [sophon, sophonTestnet, sophonOS, sophonOSTestnet] as const,
}: CreateMobileConfigParams) {
  return createConfig({
    chains,
    storage: createStorage({
      storage: SophonAppStorage,
    }),
    transports: {
      [sophon.id]: http(),
      [sophonTestnet.id]: http(),
      [sophonOS.id]: http(),
      [sophonOSTestnet.id]: http(),
    },
  });
}

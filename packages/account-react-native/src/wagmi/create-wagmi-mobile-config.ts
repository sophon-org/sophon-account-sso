import { sophonOS, sophonOSTestnet } from '@sophon-labs/account-core';
import { sophon, sophonTestnet } from 'viem/chains';
import type { CreateConfigParameters } from 'wagmi';
import { createConfig, createStorage, http } from 'wagmi';
import { SophonAppStorage } from '../provider/storage';

export type CreateWagmiMobileConfigParams = {
  /**
   * Custom chains to support
   * @default [sophon, sophonTestnet, sophonOS, sophonOSTestnet]
   */
  chains?: CreateConfigParameters['chains'];
};

export function createWagmiMobileConfig({
  chains = [sophon, sophonTestnet, sophonOS, sophonOSTestnet],
}: CreateWagmiMobileConfigParams = {}) {
  // Build transports for all chains
  const transports = chains.reduce(
    (acc, chain) => {
      acc[chain.id] = http();
      return acc;
    },
    {} as Record<number, ReturnType<typeof http>>,
  );

  return createConfig({
    chains,
    storage: createStorage({
      storage: SophonAppStorage,
    }),
    transports,
  });
}

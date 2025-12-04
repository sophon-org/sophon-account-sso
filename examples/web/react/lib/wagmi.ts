import { sophonOSTestnet } from '@sophon-labs/account-core';
import { cookieStorage, createConfig, createStorage, http } from 'wagmi';

export function getWagmiConfig() {
  return createConfig({
    chains: [sophonOSTestnet],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [sophonOSTestnet.id]: http(),
    },
  });
}

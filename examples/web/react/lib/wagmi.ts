import { cookieStorage, createConfig, createStorage, http } from 'wagmi';
import { sophonTestnet } from 'wagmi/chains';

export function getWagmiConfig() {
  return createConfig({
    chains: [sophonTestnet],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [sophonTestnet.id]: http(),
    },
  });
}

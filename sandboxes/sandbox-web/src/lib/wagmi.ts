import { sophonTestnet } from 'viem/chains';
import { createConfig, http } from 'wagmi';

export function getWagmiConfig() {
  return createConfig({
    chains: [sophonTestnet],
    transports: {
      [sophonTestnet.id]: http(),
    },
    ssr: true,
  });
}

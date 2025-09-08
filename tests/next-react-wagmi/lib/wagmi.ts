import { createConfig, http } from 'wagmi';
import { sophonTestnet } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [sophonTestnet],
  transports: {
    [sophonTestnet.id]: http(),
  },
  ssr: true,
});

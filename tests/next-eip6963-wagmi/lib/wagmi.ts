import { createSophonEIP6963Emitter } from '@sophon-labs/account-eip6963';
import { createConfig, http } from 'wagmi';
import { sophonTestnet } from 'wagmi/chains';

createSophonEIP6963Emitter(
  'testnet',
  process.env.NEXT_PUBLIC_ACCOUNT_SERVER_URL,
);

export const wagmiConfig = createConfig({
  chains: [sophonTestnet],
  transports: {
    [sophonTestnet.id]: http(),
  },
  ssr: true,
});

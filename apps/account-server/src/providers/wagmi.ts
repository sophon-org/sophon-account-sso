import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from 'wagmi';
import { walletConnect } from 'wagmi/connectors';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';

export const getWagmiConfig = () => {
  const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

  return createConfig({
    chains: [SOPHON_VIEM_CHAIN],
    connectors: [
      injected(),
      // We would run into `ReferenceError: indexedDB is not defined` during SSR without the check
      // see https://github.com/rainbow-me/rainbowkit/issues/2476 for reference
      ...(typeof indexedDB !== 'undefined'
        ? [
            walletConnect({
              projectId: walletConnectProjectId,
              showQrModal: false,
            }),
          ]
        : []),
    ],
    transports: {
      [SOPHON_VIEM_CHAIN.id]: http(),
    },
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
  });
};

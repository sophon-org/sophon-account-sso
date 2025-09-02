'use client';

import { createSophonEIP6963Emitter } from '@sophon-labs/account-eip6963';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import type { ReactNode } from 'react';
import { sophonTestnet } from 'viem/chains';
import { createConfig, http, type State, WagmiProvider } from 'wagmi';

const CHAIN_ID = (process.env.NEXT_PUBLIC_CHAIN_ID as string) ?? '531050104';
createSophonEIP6963Emitter(CHAIN_ID === '50104' ? 'mainnet' : 'testnet');

export const projectId = '760fb7a448e58431c9cfbab80743ab1c';

const queryClient = new QueryClient();

if (!projectId) throw new Error('Project ID is not defined');

export const config = createConfig(
  getDefaultConfig({
    chains: [sophonTestnet],
    transports: {
      [sophonTestnet.id]: http(),
    },

    walletConnectProjectId: projectId,

    appName: 'Sophon Account via EIP-6963',
    appDescription: 'Sophon Account via EIP-6963',
    appUrl: 'https://my.staging.sophon.xyz',
    appIcon: 'https://family.co/logo.png',
  }),
);

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

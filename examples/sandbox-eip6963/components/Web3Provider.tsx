'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@sophon-labs/account-eip6963/testnet';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import type { ReactNode } from 'react';
import { sophonTestnet } from 'viem/chains';
import { createConfig, http, type State, WagmiProvider } from 'wagmi';

export const projectId = '760fb7a448e58431c9cfbab80743ab1c';

const queryClient = new QueryClient();

if (!projectId) throw new Error('Project ID is not defined');

const config = createConfig(
  getDefaultConfig({
    chains: [sophonTestnet],
    transports: {
      [sophonTestnet.id]: http(),
    },

    walletConnectProjectId: projectId,

    appName: 'Sophon Account',
    appDescription: 'Sophon Account',
    appUrl: 'https://sophon.xyz',
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

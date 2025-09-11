'use client';

import { createSophonConnector } from '@sophon-labs/account-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { sophonTestnet } from 'viem/chains';
import { createConfig, http, type State, WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [sophonTestnet],
  connectors: [
    createSophonConnector('testnet', '123b216c-678e-4611-af9a-2d5b7b061258'),
  ],
  transports: {
    [sophonTestnet.id]: http(),
  },
});

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

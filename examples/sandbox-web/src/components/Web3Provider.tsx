'use client';
import { sophonSsoConnector } from '@sophon-labs/account-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { sophonTestnet } from 'viem/chains';
import { createConfig, http, WagmiProvider } from 'wagmi';

// Wagmi config
const wagmiConfig = createConfig({
  chains: [sophonTestnet],
  connectors: [sophonSsoConnector('local')],
  transports: {
    [sophonTestnet.id]: http(),
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

'use client';
import {
  SophonContextProvider,
  SophonWagmiConnector,
} from '@sophon-labs/account-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { sophonTestnet } from 'viem/chains';
import { createConfig, http, WagmiProvider } from 'wagmi';

// Wagmi config
export const config = createConfig({
  chains: [sophonTestnet],
  connectors: [],
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
    <SophonContextProvider
      network="testnet"
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
      authServerUrl="http://localhost:3000"
    >
      <WagmiProvider config={config}>
        <SophonWagmiConnector>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SophonWagmiConnector>
      </WagmiProvider>
    </SophonContextProvider>
  );
};

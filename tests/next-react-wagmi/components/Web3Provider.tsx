'use client';

import {
  SophonContextProvider,
  SophonWagmiConnector,
} from '@sophon-labs/account-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../lib/wagmi';

const queryClient = new QueryClient();

export default function Web3ModalProvider({
  children,
  initialState,
}: Readonly<{
  children: ReactNode;
  initialState?: State;
}>) {
  return (
    <SophonContextProvider
      network={'testnet'}
      partnerId={'123b216c-678e-4611-af9a-2d5b7b061258'}
    >
      <WagmiProvider config={wagmiConfig} initialState={initialState}>
        <SophonWagmiConnector>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SophonWagmiConnector>
      </WagmiProvider>
    </SophonContextProvider>
  );
}

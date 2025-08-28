'use client';

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
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

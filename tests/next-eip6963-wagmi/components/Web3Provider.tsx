'use client';

import { createSophonEIP6963Emitter } from '@sophon-labs/account-eip6963';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../lib/wagmi';

createSophonEIP6963Emitter(
  'testnet',
  process.env.NEXT_PUBLIC_ACCOUNT_SERVER_URL,
);

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

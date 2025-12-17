'use client';

import { DataScopes, sophonOSTestnet } from '@sophon-labs/account-core';
import {
  SophonContextProvider,
  SophonWagmiConnector,
} from '@sophon-labs/account-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { getWagmiConfig } from '../lib/wagmi';

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getWagmiConfig());
  const [queryClient] = useState(() => new QueryClient());
  return (
    <SophonContextProvider
      chainId={sophonOSTestnet.id}
      authServerUrl="http://localhost:3000"
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
      dataScopes={[DataScopes.email]}
    >
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <SophonWagmiConnector>{children}</SophonWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </SophonContextProvider>
  );
}

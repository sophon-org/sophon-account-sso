'use client';
import {
  SophonContextProvider,
  SophonWagmiConnector,
} from '@sophon-labs/account-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { getWagmiConfig } from '@/lib/wagmi';

export const Web3Provider = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: State | undefined;
}) => {
  const [config] = useState(() => getWagmiConfig());
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <SophonContextProvider
      network="testnet"
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
      authServerUrl="http://localhost:3000"
    >
      <WagmiProvider config={config} initialState={initialState}>
        <SophonWagmiConnector>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SophonWagmiConnector>
      </WagmiProvider>
    </SophonContextProvider>
  );
};

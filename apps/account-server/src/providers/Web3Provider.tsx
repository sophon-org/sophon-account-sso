'use client';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import {
  DynamicContextProvider,
  dynamicEvents,
} from '@dynamic-labs/sdk-react-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { env } from '@/env';
import { sendMessage } from '@/events';
import { getWagmiConfig } from './wagmi';

// work around for dynamic events not working properly and giving the primary wallet on auth success
dynamicEvents.on('primaryWalletChanged', (newPrimaryWallet) => {
  sendMessage('k1.login', {
    address: newPrimaryWallet.address as `0x${string}`,
    wallet: newPrimaryWallet,
  });
});

export const Web3Provider = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) => {
  const [wagmiConfig] = useState(() => getWagmiConfig());
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
    <DynamicContextProvider
      settings={{
        initialAuthenticationMode: 'connect-and-sign',
        environmentId: env.NEXT_PUBLIC_DYNAMIC_PROVIDER_ID,
        walletConnectors: [EthereumWalletConnectors],
        events: {
          // This is called when the user clicks on the login button
          onAuthInit() {
            sendMessage('k1.login.init', null);
          },
          // This is called on the callback processing from social login
          onAuthFlowOpen() {
            sendMessage('k1.login.init', null);
          },
          // This is called after everything is validated and the user should be considered authenticated
          onAuthSuccess() {
            sendMessage('modal.open', null);
          },
          // This is called when the user
          onLogout() {
            sendMessage('k1.logout', null);
          },
        },
      }}
    >
      <WagmiProvider config={wagmiConfig} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
};

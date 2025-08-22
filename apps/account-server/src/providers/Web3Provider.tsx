'use client';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import {
  DynamicContextProvider,
  dynamicEvents,
} from '@dynamic-labs/sdk-react-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { env } from '@/env';
import { sendMessage } from '@/events';
import { VIEM_CHAIN } from '@/lib/constants';

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

// Wagmi config with MetaMask connector - uses environment-based chain
const wagmiConfig = createConfig({
  chains: [VIEM_CHAIN],
  connectors: [
    injected(),
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: false,
    }),
  ],
  transports: {
    [VIEM_CHAIN.id]: http(),
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

// work around for dynamic events not working properly and giving the primary wallet on auth success
dynamicEvents.on('primaryWalletChanged', (newPrimaryWallet) => {
  sendMessage('k1.login', {
    address: newPrimaryWallet.address as `0x${string}`,
    wallet: newPrimaryWallet,
  });
});

export const Web3Provider = ({ children }: { children: ReactNode }) => {
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
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
};

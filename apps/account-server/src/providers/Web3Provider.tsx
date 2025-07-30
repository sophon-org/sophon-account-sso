'use client';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
//import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { env } from '@/env';
import { sendMessage } from '@/events';
import { VIEM_CHAIN } from '@/lib/constants';

// Wagmi config with MetaMask connector - uses environment-based chain
const wagmiConfig = createConfig({
  chains: [VIEM_CHAIN],
  connectors: [injected()],
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

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <DynamicContextProvider
      settings={{
        initialAuthenticationMode: 'connect-and-sign',
        environmentId: env.NEXT_PUBLIC_DYNAMIC_PROVIDER_ID!,
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
          onEmbeddedWalletCreated(credential, user) {
            console.log('🔥 onEmbeddedWalletCreated', user, credential);
            // sendMessage('k1.login', {
            //   address: user.primaryWallet!.address as `0x${string}`,
            //   wallet: user.primaryWallet!,
            // });
          },
          onWalletAdded(user) {
            sendMessage('k1.login', {
              address: user.wallet.address as `0x${string}`,
              wallet: user.wallet,
            });
          },
          // This is called after everything is validated and the user should be considered authenticated
          onAuthSuccess(user) {
            if (user.primaryWallet) {
              sendMessage('k1.login', {
                address: user.primaryWallet!.address as `0x${string}`,
                wallet: user.primaryWallet!,
              });
            }
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

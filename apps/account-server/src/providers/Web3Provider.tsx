'use client';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { env } from '@/env';
import { sendMessage } from '@/events';
import { getWagmiConfig } from './wagmi';
import {
  OpenfortProvider,
  AuthProvider,
  OpenfortWalletConfig,
} from '@openfort/react';

const authProviders: AuthProvider[] = [
  AuthProvider.EMAIL,
  AuthProvider.GUEST,
  AuthProvider.GOOGLE,
  AuthProvider.TWITTER,
  AuthProvider.WALLET,
];

const walletConfig: OpenfortWalletConfig = {
  shieldPublishableKey: env.NEXT_PUBLIC_SHIELD_PUBLISHABLE_KEY,
  createEncryptedSessionEndpoint: env.NEXT_PUBLIC_OPENFORT_API_ENDPOINT,
};

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
    // <DynamicContextProvider
    //   settings={{
    //     initialAuthenticationMode: 'connect-and-sign',
    //     environmentId: env.NEXT_PUBLIC_DYNAMIC_PROVIDER_ID,
    //     walletConnectors: [EthereumWalletConnectors],
    //     events: {
    //       // This is called when the user clicks on the login button
    //       onAuthInit() {
    //         sendMessage('k1.login.init', null);
    //       },
    //       // This is called on the callback processing from social login
    //       onAuthFlowOpen() {
    //         sendMessage('k1.login.init', null);
    //       },
    //       // This is called after everything is validated and the user should be considered authenticated
    //       onAuthSuccess({ primaryWallet }) {
    //         if (primaryWallet) {
    //           sendMessage('k1.login', {
    //             address: primaryWallet.address as `0x${string}`,
    //             wallet: primaryWallet,
    //           });
    //           // on dynamic, the first signature always takes more time
    //           // so we trigger a signature on authentication to speedup the process
    //           primaryWallet.signMessage(
    //             'Hello from sophon, heating up the wallet.',
    //           );
    //         }
    //         sendMessage('modal.open', null);
    //       },
    //       // This is called when the user
    //       onLogout() {
    //         sendMessage('k1.logout', null);
    //       },
    //     },
    //   }}
    // >
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <OpenfortProvider
          publishableKey={env.NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY}
          uiConfig={{
            authProviders,
          }}
          onConnect={(params) => {
            console.log('onConnect', params);
            sendMessage('k1.login', {
              address: params.address as `0x${string}`,
            });
          }}
          onDisconnect={() => {
            sendMessage('k1.logout', null);
          }}
          walletConfig={walletConfig}
        >
          {children}
        </OpenfortProvider>
      </QueryClientProvider>
    </WagmiProvider>
    // </DynamicContextProvider>
  );
};

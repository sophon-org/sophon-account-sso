'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@sophon-labs/account-eip6963/os-testnet';
//import '@sophon-labs/account-eip6963/testnet';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import type { ReactNode } from 'react';
import type { Chain } from 'viem/chains';
import { createConfig, http, type State, WagmiProvider } from 'wagmi';

export const projectId = '760fb7a448e58431c9cfbab80743ab1c';

const queryClient = new QueryClient();

if (!projectId) throw new Error('Project ID is not defined');

export const TESTNET_RPC_URL = 'https://rpc.testnet.os.sophon.com';

// TODO: change config to new sophon testnet
export const new_sophon_testnet = {
  id: 531050204,
  name: 'Sophon testnet',
  nativeCurrency: {
    name: 'Sophon',
    symbol: 'SOPH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [TESTNET_RPC_URL],
    },
    public: {
      http: [TESTNET_RPC_URL],
    },
  },
  contracts: {
    multicall3: { address: '0x83c04d112adedA2C6D9037bb6ecb42E7f0b108Af' },
  },
} as const satisfies Chain;

const config = createConfig(
  getDefaultConfig({
    chains: [new_sophon_testnet],
    transports: {
      [new_sophon_testnet.id]: http(),
    },

    walletConnectProjectId: projectId,

    appName: 'Sophon Account via EIP-6963',
    appDescription: 'Sophon Account via EIP-6963',
    appUrl: 'https://my.staging.sophon.xyz',
    appIcon: 'https://family.co/logo.png',
  }),
);

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createConfig, http } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { sophonTestnet } from "viem/chains";
import { ReactNode } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { env } from "@/env";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";

// Wagmi config with MetaMask connector
const wagmiConfig = createConfig({
  chains: [sophonTestnet],
  connectors: [metaMask()],
  transports: {
    [sophonTestnet.id]: http("https://rpc.testnet.sophon.xyz"),
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
        environmentId: env.NEXT_PUBLIC_DYNAMIC_PROVIDER_ID!,
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
};

"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider} from "wagmi";
import { sophonSsoConnector } from "../../../../packages/sophon-account-connector/dist";
import { sophonTestnet } from "viem/chains";
import { ReactNode } from "react";

// Wagmi config
const wagmiConfig = createConfig({
  chains: [sophonTestnet],
  connectors: [sophonSsoConnector()],
  transports: {
    [sophonTestnet.id]: http(),
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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

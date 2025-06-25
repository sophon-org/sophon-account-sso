"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createConfig, http } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { sophonTestnet } from "viem/chains";
import { ReactNode } from "react";

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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

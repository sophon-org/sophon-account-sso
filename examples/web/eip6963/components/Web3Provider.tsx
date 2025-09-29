"use client";
import "@sophon-labs/account-eip6963/testnet";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { sophon, sophonTestnet } from "viem/chains";

import { ConnectKitProvider } from "connectkit";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { SophonContextProvider, SophonWagmiConnector } from "@sophon-labs/account-react";
import { DataScopes } from "@sophon-labs/account-core";

import { ConnectModeProvider, useConnectMode } from "./connect-mode";
import type { ConnectMode } from "./connect-mode";

const CHAIN_ID = (process.env.NEXT_PUBLIC_CHAIN_ID as string) ?? "531050104";
export const projectId = "760fb7a448e58431c9cfbab80743ab1c";
if (!projectId) throw new Error("Project ID is not defined");

const queryClient = new QueryClient();

const appMeta = {
  name: "Sophon Account via EIP-6963",
  description: "Sophon Account via EIP-6963",
  url: "https://my.staging.sophon.xyz",
  icons: ["https://family.co/logo.png"],
};

function buildWagmiConfig(mode: ConnectMode) {
  const base = [injected({ shimDisconnect: true }), coinbaseWallet({ appName: appMeta.name })];

  const wc =
    mode === "walletconnect"
      ? walletConnect({
          projectId,
          showQrModal: true,
          metadata: appMeta,
          logger: "silent",
        })
      : mode === "rainbowkit" || mode === "connectkit"
      ? walletConnect({
          projectId,
          showQrModal: false,
          metadata: appMeta,
          logger: "silent",
        })
      : null;

  const connectors = wc ? [...base, wc] : base;

  return createConfig({
    chains: [sophon, sophonTestnet],
    transports: {
      [sophon.id]: http(),
      [sophonTestnet.id]: http(),
    },
    connectors,
    ssr: true,
    multiInjectedProviderDiscovery: true,
  });
}

function ProvidersByMode({ children }: { children: ReactNode }) {
  const { mode } = useConnectMode();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const config = useMemo(() => buildWagmiConfig(mode), [mode]);
  if (!mounted) return null;

  const sophonNetwork =
    (process.env.NEXT_PUBLIC_SOPHON_NETWORK as "mainnet" | "testnet") ??
    (CHAIN_ID === "50104" ? "mainnet" : "testnet");

  const partnerId =
    process.env.NEXT_PUBLIC_SOPHON_PARTNER_ID ?? "123b216c-678e-4611-af9a-2d5b7b061258";

  return (
    <SophonContextProvider
      network={sophonNetwork}
      partnerId={partnerId}
      dataScopes={[DataScopes.email]}
    >
      <WagmiProvider key={`wagmi-${mode}`} config={config}>
        <QueryClientProvider client={queryClient}>
          {mode === "rainbowkit" ? (
            <RainbowKitProvider key={`rk-${mode}`}>
              <SophonWagmiConnector>{children}</SophonWagmiConnector>
            </RainbowKitProvider>
          ) : mode === "connectkit" ? (
            <ConnectKitProvider key={`ck-${mode}`}>
              <SophonWagmiConnector>{children}</SophonWagmiConnector>
            </ConnectKitProvider>
          ) : mode === "walletconnect" ? (
            <>{children}</>
          ) : (
            <SophonWagmiConnector>{children}</SophonWagmiConnector>
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </SophonContextProvider>
  );
}

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <ConnectModeProvider>
      <ProvidersByMode>{children}</ProvidersByMode>
    </ConnectModeProvider>
  );
}

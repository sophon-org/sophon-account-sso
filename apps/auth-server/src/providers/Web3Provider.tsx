"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createConfig, http } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { sophonTestnet } from "viem/chains";
import { ReactNode } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { useAccountContext } from "@/hooks/useAccountContext";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { useAuthResponse } from "@/hooks/useAuthResponse";
import { deployAccount, getsSmartAccounts } from "@/service/account.service";
import { AccountStep } from "@/context/account-context";
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
  const { incomingRequest, sessionPreferences } = useMessageHandler();

  const { login, logout, setAuthStep } = useAccountContext();
  const { handleAuthSuccessResponse } = useAuthResponse();

  return (
    <DynamicContextProvider
      settings={{
        environmentId: env.NEXT_PUBLIC_DYNAMIC_PROVIDER_ID!,
        walletConnectors: [EthereumWalletConnectors],
        events: {
          onAuthFailure: () => {
            alert("failure");
          },
          onAuthInit: () => {
            alert("init");
          },
          onAuthFlowCancel: () => {
            alert("cancel");
          },

          onWalletAdded: async ({ wallet, userWallets }) => {
            console.log("🔥🔥🔥🔥🔥 Dynamic wallet added", wallet, userWallets);

            const { accounts } = await getsSmartAccounts(
              wallet.address as `0x${string}`
            );

            if (accounts.length === 0) {
              setAuthStep(AccountStep.DEPLOYING_ACCOUNT);
              console.log("🔥🔥🔥🔥🔥 No smart account found, deploying...");
              const response = await deployAccount(
                wallet.address as `0x${string}`
              );
              accounts.push(...response.accounts);
            } else {
              console.log(
                "🔥🔥🔥🔥🔥 Smart account found, using existing account"
              );
            }

            await login({
              address: accounts[0],
              username: wallet.address,
              owner: {
                address: wallet.address as `0x${string}`,
                passkey: null,
                privateKey: null,
              },
            });

            setAuthStep(AccountStep.AUTHENTICATED);

            handleAuthSuccessResponse(
              { address: accounts[0] },
              incomingRequest!,
              sessionPreferences
            );
          },
          onEmbeddedWalletCreated: (credentials, user) => {
            console.log(
              "🔥🔥🔥🔥🔥 Dynamic embedded wallet created",
              credentials,
              user
            );
          },
          onAuthSuccess: async (payload) => {
            alert("success");
            console.log(
              "🔥🔥🔥🔥🔥 Dynamic user authenticated, sending success response!",
              payload
            );

            // for new users, dynamic create the user and trigger the authentication success
            // while the user wallet is still being created, so we have to wait on those cases
            if (payload.isAuthenticated && payload.primaryWallet) {
              const { accounts } = await getsSmartAccounts(
                payload.primaryWallet!.address as `0x${string}`
              );

              if (accounts.length === 0) {
                setAuthStep(AccountStep.DEPLOYING_ACCOUNT);
                console.log("🔥🔥🔥🔥🔥 No smart account found, deploying...");
                const response = await deployAccount(
                  payload.primaryWallet!.address as `0x${string}`
                );
                accounts.push(...response.accounts);
              } else {
                console.log(
                  "🔥🔥🔥🔥🔥 Smart account found, using existing account"
                );
              }

              await login({
                address: accounts[0],
                username: payload.user.username!,
                owner: {
                  address: payload.primaryWallet!.address as `0x${string}`,
                  passkey: null,
                  privateKey: null,
                },
              });

              setAuthStep(AccountStep.AUTHENTICATED);

              handleAuthSuccessResponse(
                { address: accounts[0] },
                incomingRequest!,
                sessionPreferences
              );
            } else if (payload.isAuthenticated) {
              setAuthStep(AccountStep.CREATING_EMBEDDED_WALLET);
            }
          },
          onLogout: () => {
            alert("logout");
            console.log(
              "🔥🔥🔥🔥🔥 Dynamic user logged out, logging out from account context"
            );
            logout();
          },
        },
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

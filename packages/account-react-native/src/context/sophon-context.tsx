import "../pollyfills";
import type { Message } from "@sophon-labs/account-communicator";
// everything else
import {
  AccountServerURL,
  type DataScopes,
  type SophonNetworkType,
} from "@sophon-labs/account-core";
import type { EIP1193Provider } from "@sophon-labs/account-provider";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { type Address, type Chain, createWalletClient, custom, type WalletClient } from "viem";
import { sophon, sophonTestnet } from "viem/chains";
import { erc7846Actions } from "viem/experimental";
import { eip712WalletActions } from "viem/zksync";
import { useEmbeddedAuth } from "../auth/useAuth";
import type { SophonMainViewProps } from "../components";
import { AuthPortal } from "../auth-portal";
import { dynamicClient } from "../lib/dynamic";
import { useUIEventHandler } from "../messaging";
import { createMobileProvider, SophonAppStorage, StorageKeys } from "../provider";
import { freshInstallActions } from "../provider/fresh-install";
import type { SophonJWTToken } from "../types";

export interface SophonContextConfig {
  initialized: boolean;
  partnerId: string;
  authServerUrl?: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: EIP1193Provider;
  network: SophonNetworkType;
  accessToken?: SophonJWTToken | null;
  refreshToken?: SophonJWTToken | null;
  updateAccessToken: (data: SophonJWTToken) => void;
  updateRefreshToken: (data: SophonJWTToken) => void;
  logout: () => Promise<void>;
  error?: { description: string; code: number };
  setError: (error: { description: string; code: number }) => void;
  insets?: SophonMainViewProps["insets"];
  currentRequest?: Message;
  setCurrentRequest: (request?: Message) => void;
}

export const SophonContext = createContext<SophonContextConfig>({
  initialized: false,
  partnerId: "",
  chain: sophonTestnet,
  setAccount: () => {},
  network: "testnet",
  updateAccessToken: () => {},
  updateRefreshToken: () => {},
  logout: async () => {},
  error: undefined,
  setError: (_: { description: string; code: number }) => {},
  currentRequest: undefined,
  setCurrentRequest: () => {},
});

export interface SophonAccount {
  address: Address;
  owner: Address;
}

export const SophonContextProvider = ({
  children,
  network = "testnet",
  authServerUrl,
  partnerId,
  dataScopes,
  insets,
}: {
  children: React.ReactNode;
  network: SophonNetworkType;
  authServerUrl?: string;
  partnerId: string;
  dataScopes: DataScopes[];
  insets?: SophonMainViewProps["insets"];
}) => {
  const [error, setError] = useState<{ description: string; code: number }>();
  const serverUrl = useMemo(
    () => authServerUrl ?? AccountServerURL[network],
    [authServerUrl, network],
  );
  const [account, setAccount] = useState<SophonAccount | undefined>();
  const [currentRequest, setCurrentRequest] = useState<Message | undefined>();

  const [initialized, setInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState<SophonJWTToken | undefined>();
  const [refreshToken, setRefreshToken] = useState<SophonJWTToken | undefined>();
  const { logout: logoutEmbedded } = useEmbeddedAuth();
  // const [walletClient, setWalletClient] = useState<WalletClient | undefined>();
  // const { wallets } = useReactiveClient(dynamicClient);

  // const account = useMemo((): SophonAccount | undefined => {
  //   if (!wallets.primary) return undefined;

  //   return {
  //     address: wallets.primary.address as Address,
  //   };
  // }, [wallets.primary]);

  const chain = useMemo(() => (network === "mainnet" ? sophon : sophonTestnet), [network]);
  const provider = useMemo(() => {
    const provider = createMobileProvider(serverUrl, chain);
    return provider;
  }, [serverUrl, chain]);

  const walletClient = createWalletClient({
    chain: chain,
    transport: custom(provider),
  })
    .extend(erc7846Actions())
    .extend(eip712WalletActions());

  // useEffect(() => {
  //   (async () => {
  //     if (wallets.primary) {
  //       const client = await dynamicClient.viem.createWalletClient({
  //         wallet: wallets.primary!,
  //       });
  //       setWalletClient(client);
  //     } else if (!wallets.primary) {
  //       setWalletClient(undefined);
  //     }
  //   })();
  // }, [wallets.primary]);

  useEffect(() => {
    freshInstallActions();
  }, []);

  useUIEventHandler("initialized", () => {
    // if (SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)) {
    //   setAccount(
    //     JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)!),
    //   );
    // }
    if (SophonAppStorage.getItem(StorageKeys.USER_ACCESS_TOKEN)) {
      setAccessToken(JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCESS_TOKEN)!));
    }
    if (SophonAppStorage.getItem(StorageKeys.USER_REFRESH_TOKEN)) {
      setRefreshToken(JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_REFRESH_TOKEN)!));
    }

    setInitialized(true);
  });

  useUIEventHandler("setAccessToken", (incomingToken) => {
    updateAccessToken(incomingToken);
  });

  useUIEventHandler("setRefreshToken", (incomingToken) => {
    updateRefreshToken(incomingToken);
  });

  const updateAccessToken = useCallback((newToken: SophonJWTToken) => {
    setAccessToken(newToken);
    SophonAppStorage.setItem(StorageKeys.USER_ACCESS_TOKEN, JSON.stringify(newToken));
  }, []);

  const updateRefreshToken = useCallback((newToken: SophonJWTToken) => {
    setRefreshToken(newToken);
    SophonAppStorage.setItem(StorageKeys.USER_REFRESH_TOKEN, JSON.stringify(newToken));
  }, []);

  useUIEventHandler("handleError", setError);

  // const setAccountWithEffect = useCallback((account?: SophonAccount) => {
  //   setAccount(account);
  //   if (account) {
  //     SophonAppStorage.setItem(
  //       StorageKeys.USER_ACCOUNT,
  //       JSON.stringify(account),
  //     );
  //   } else {
  //     SophonAppStorage.removeItem(StorageKeys.USER_ACCOUNT);
  //   }
  // }, []);

  // const walletClient = useMemo(async () => {
  //   return await dynamicClient.viem.createWalletClient({
  //     wallet: wallets.primary!,
  //   });
  // }, [wallets]);

  const logout = useCallback(async () => {
    await logoutEmbedded();
    await provider?.disconnect();
    setAccount(undefined);
    SophonAppStorage.clear();
  }, [logoutEmbedded, provider, setAccount]);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      initialized,
      mainnet: network === "mainnet",
      chain,
      authServerUrl: serverUrl,
      walletClient,
      account,
      setAccount,
      accessToken,
      refreshToken,
      partnerId,
      error,
      setError,
      network,
      updateAccessToken,
      updateRefreshToken,
      logout,
      currentRequest,
      setCurrentRequest,
    }),
    [
      initialized,
      network,
      serverUrl,
      walletClient,
      account,
      chain,
      accessToken,
      refreshToken,
      partnerId,
      error,
      setError,
      network,
      updateAccessToken,
      updateRefreshToken,
      logout,
      currentRequest,
      setCurrentRequest,
    ],
  );

  useUIEventHandler("logout", () => {
    logout();
  });

  return (
    <SophonContext.Provider value={contextValue}>
      {children}
      <dynamicClient.reactNative.WebView />
      <AuthPortal
        insets={insets}
        scopes={dataScopes}
        authServerUrl={serverUrl}
        partnerId={partnerId}
      />
    </SophonContext.Provider>
  );
};

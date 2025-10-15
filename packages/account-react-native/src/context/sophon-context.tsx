import '../pollyfills';
// everything else
import {
  AccountServerURL,
  type DataScopes,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import type { EIP1193Provider } from '@sophon-labs/account-provider';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type Address, type Chain, type WalletClient } from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
// import { erc7846Actions } from 'viem/experimental';
// import { eip712WalletActions } from 'viem/zksync';
import type { SophonJWTToken } from '@/types';
import { useUIEventHandler } from '../messaging';
import {
  createWalletProvider,
  SophonAppStorage,
  StorageKeys,
} from '../provider';
import { freshInstallActions } from '../provider/fresh-install';
import { dynamicClient } from '../lib/dynamic';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { useEmbeddedAuth } from '../auth/useAuth';

export interface SophonContextConfig {
  initialized: boolean;
  partnerId: string;
  authServerUrl?: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  // setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: EIP1193Provider;
  network: SophonNetworkType;
  accessToken?: SophonJWTToken | null;
  refreshToken?: SophonJWTToken | null;
  updateAccessToken: (data: SophonJWTToken) => void;
  updateRefreshToken: (data: SophonJWTToken) => void;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;
  error?: { description: string; code: number };
  setError: (error: { description: string; code: number }) => void;
}

export const SophonContext = createContext<SophonContextConfig>({
  initialized: false,
  partnerId: '',
  chain: sophonTestnet,
  // setAccount: () => {},
  network: 'testnet',
  updateAccessToken: () => {},
  updateRefreshToken: () => {},
  logout: async () => {},
  disconnect: async () => {},
  error: undefined,
  setError: (_: { description: string; code: number }) => {},
});

export interface SophonAccount {
  address: Address;
}

export const SophonContextProvider = ({
  children,
  network = 'testnet',
  authServerUrl,
  partnerId,
}: {
  children: React.ReactNode;
  network: SophonNetworkType;
  authServerUrl?: string;
  partnerId: string;
  dataScopes: DataScopes[];
}) => {
  const [error, setError] = useState<{ description: string; code: number }>();
  const serverUrl = useMemo(
    () => authServerUrl ?? AccountServerURL[network],
    [authServerUrl, network],
  );

  const [initialized, setInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState<SophonJWTToken | undefined>();
  const [refreshToken, setRefreshToken] = useState<
    SophonJWTToken | undefined
  >();
  const { logout: logoutEmbedded } = useEmbeddedAuth();
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>();
  const { wallets } = useReactiveClient(dynamicClient);

  const account = useMemo((): SophonAccount | undefined => {
    if (!wallets.primary) return undefined;

    return {
      address: wallets.primary.address as Address,
    };
  }, [wallets.primary]);

  useEffect(() => {
    (async () => {
      if (wallets.primary) {
        setWalletClient(
          await dynamicClient.viem.createWalletClient({
            wallet: wallets.primary!,
          }),
        );
      } else if (!wallets.primary) {
        setWalletClient(undefined);
      }
    })();
  }, [wallets.primary]);

  useEffect(() => {
    freshInstallActions();
  }, []);

  useUIEventHandler('initialized', () => {
    // if (SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)) {
    //   setAccount(
    //     JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)!),
    //   );
    // }
    if (SophonAppStorage.getItem(StorageKeys.USER_ACCESS_TOKEN)) {
      setAccessToken(
        JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCESS_TOKEN)!),
      );
    }
    if (SophonAppStorage.getItem(StorageKeys.USER_REFRESH_TOKEN)) {
      setRefreshToken(
        JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_REFRESH_TOKEN)!),
      );
    }

    setInitialized(true);
  });

  const chain = useMemo(
    () => (network === 'mainnet' ? sophon : sophonTestnet),
    [network],
  );
  const provider = useMemo(() => {
    const provider = createWalletProvider(serverUrl, chain);
    return provider;
  }, [serverUrl, chain]);

  useUIEventHandler('setAccessToken', (incomingToken) => {
    updateAccessToken(incomingToken);
  });

  useUIEventHandler('setRefreshToken', (incomingToken) => {
    updateRefreshToken(incomingToken);
  });

  const updateAccessToken = useCallback((newToken: SophonJWTToken) => {
    setAccessToken(newToken);
    SophonAppStorage.setItem(
      StorageKeys.USER_ACCESS_TOKEN,
      JSON.stringify(newToken),
    );
  }, []);

  const updateRefreshToken = useCallback((newToken: SophonJWTToken) => {
    setRefreshToken(newToken);
    SophonAppStorage.setItem(
      StorageKeys.USER_REFRESH_TOKEN,
      JSON.stringify(newToken),
    );
  }, []);

  useUIEventHandler('handleError', setError);

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

  // const walletClient = createWalletClient({
  //   chain: chain,
  //   transport: custom(provider),
  // })
  //   .extend(erc7846Actions())
  //   .extend(eip712WalletActions());

  // const walletClient = useMemo(async () => {
  //   return await dynamicClient.viem.createWalletClient({
  //     wallet: wallets.primary!,
  //   });
  // }, [wallets]);

  const disconnect = useCallback(async () => {
    // await provider?.disconnect();
    await logoutEmbedded();
    SophonAppStorage.clear();
    // setAccount(undefined);
  }, [provider, logoutEmbedded]);

  const logout = useCallback(async () => {
    await logoutEmbedded();
    SophonAppStorage.clear();
    // await provider.request({
    //   method: 'wallet_revokePermissions',
    //   params: [],
    // });
    // await disconnect();
  }, [logoutEmbedded]);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      initialized,
      mainnet: network === 'mainnet',
      chain,
      authServerUrl: serverUrl,
      walletClient,
      account,
      // setAccount: setAccountWithEffect,
      accessToken,
      refreshToken,
      partnerId,
      error,
      setError,
      network,
      updateAccessToken,
      updateRefreshToken,
      logout,
      disconnect,
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
      disconnect,
    ],
  );

  useUIEventHandler('logout', () => {
    disconnect();
  });

  return (
    <SophonContext.Provider value={contextValue}>
      <dynamicClient.reactNative.WebView />
      {/* <SophonMainView
        scopes={dataScopes}
        insets={insets}
        authServerUrl={serverUrl}
        partnerId={partnerId}
      /> */}
      {children}
    </SophonContext.Provider>
  );
};

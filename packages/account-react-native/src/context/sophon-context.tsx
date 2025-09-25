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
import {
  type Address,
  type Chain,
  createWalletClient,
  custom,
  type WalletClient,
} from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { erc7846Actions } from 'viem/experimental';
import { eip712WalletActions } from 'viem/zksync';
import type { SophonJWTToken } from '@/types';
import { SophonMainView, type SophonMainViewProps } from '../components';
import { useUIEventHandler } from '../messaging';
import {
  createWalletProvider,
  SophonAppStorage,
  StorageKeys,
} from '../provider';
import { freshInstallActions } from '../provider/fresh-install';

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
  disconnect: () => Promise<void>;
  error?: string;
  setError: (error: string) => void;
}

export const SophonContext = createContext<SophonContextConfig>({
  initialized: false,
  partnerId: '',
  chain: sophonTestnet,
  setAccount: () => {},
  network: 'testnet',
  updateAccessToken: () => {},
  updateRefreshToken: () => {},
  logout: async () => {},
  disconnect: async () => {},
  error: undefined,
  setError: (_: string) => {},
});

export interface SophonAccount {
  address: Address;
}

export const SophonContextProvider = ({
  children,
  network = 'testnet',
  authServerUrl,
  partnerId,
  insets,
  dataScopes = [],
}: {
  children: React.ReactNode;
  network: SophonNetworkType;
  authServerUrl?: string;
  partnerId: string;
  insets?: SophonMainViewProps['insets'];
  dataScopes: DataScopes[];
}) => {
  const [error, setError] = useState<string>();
  const serverUrl = useMemo(
    () => authServerUrl ?? AccountServerURL[network],
    [authServerUrl, network],
  );

  const [initialized, setInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState<SophonJWTToken | undefined>();
  const [refreshToken, setRefreshToken] = useState<
    SophonJWTToken | undefined
  >();
  const [account, setAccount] = useState<SophonAccount | undefined>();

  useEffect(() => {
    freshInstallActions();
  }, []);

  useUIEventHandler('initialized', () => {
    if (SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)) {
      setAccount(
        JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)!),
      );
    }
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

  useUIEventHandler('mainViewError', setError);

  const setAccountWithEffect = useCallback((account?: SophonAccount) => {
    setAccount(account);
    if (account) {
      SophonAppStorage.setItem(
        StorageKeys.USER_ACCOUNT,
        JSON.stringify(account),
      );
    } else {
      SophonAppStorage.removeItem(StorageKeys.USER_ACCOUNT);
    }
  }, []);

  const walletClient = createWalletClient({
    chain: chain,
    transport: custom(provider),
  })
    .extend(erc7846Actions())
    .extend(eip712WalletActions());

  const disconnect = useCallback(async () => {
    await provider?.disconnect();
    SophonAppStorage.clear();
    setAccount(undefined);
  }, [provider]);

  const logout = useCallback(async () => {
    await provider.request({
      method: 'wallet_revokePermissions',
      params: [],
    });
    await disconnect();
  }, [provider, disconnect]);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      initialized,
      mainnet: network === 'mainnet',
      chain,
      authServerUrl: serverUrl,
      walletClient,
      account,
      setAccount: setAccountWithEffect,
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
      <SophonMainView
        scopes={dataScopes}
        insets={insets}
        authServerUrl={serverUrl}
        partnerId={partnerId}
      />
      {children}
    </SophonContext.Provider>
  );
};

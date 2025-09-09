import '../pollyfills';
// everything else
import {
  AccountServerURL,
  type DataScopes,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { createContext, useCallback, useMemo, useState } from 'react';
import {
  type Address,
  type Chain,
  createWalletClient,
  custom,
  type WalletClient,
} from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { erc7846Actions } from 'viem/experimental';
import type { WalletProvider } from 'zksync-sso';
import type { SophonJWTToken } from '@/types';
import { SophonMainView, type SophonMainViewProps } from '../components';
import { useUIEventHandler } from '../messaging';
import {
  createWalletProvider,
  SophonAppStorage,
  StorageKeys,
} from '../provider';

export interface SophonContextConfig {
  partnerId: string;
  authServerUrl?: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: WalletProvider;
  network: SophonNetworkType;
  accessToken?: SophonJWTToken | null;
  refreshToken?: SophonJWTToken | null;
  updateAccessToken: (data: SophonJWTToken) => void;
  updateRefreshToken: (data: SophonJWTToken) => void;
  disconnect: () => void;
  error?: string;
  setError: (error: string) => void;
}

export const SophonContext = createContext<SophonContextConfig>({
  partnerId: '',
  chain: sophonTestnet,
  setAccount: () => {},
  network: 'testnet',
  updateAccessToken: () => {},
  updateRefreshToken: () => {},
  disconnect: () => {},
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

  const [account, setAccount] = useState<SophonAccount | undefined>(
    SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)
      ? JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)!)
      : undefined,
  );
  const chain = useMemo(
    () => (network === 'mainnet' ? sophon : sophonTestnet),
    [network],
  );
  const provider = useMemo(() => {
    const provider = createWalletProvider(serverUrl, chain);
    return provider;
  }, [serverUrl, chain]);

  const [accessToken, setAccessToken] = useState(
    SophonAppStorage.getItem(StorageKeys.USER_ACCESS_TOKEN)
      ? JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCESS_TOKEN)!)
      : undefined,
  );

  const [refreshToken, setRefreshToken] = useState(
    SophonAppStorage.getItem(StorageKeys.USER_REFRESH_TOKEN)
      ? JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_REFRESH_TOKEN)!)
      : undefined,
  );

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
  }).extend(erc7846Actions());

  const disconnect = useCallback(() => {
    provider?.disconnect();
    SophonAppStorage.clear();
    setAccount(undefined);
  }, [provider]);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      mainnet: network === 'mainnet',
      chain,
      authServerUrl: serverUrl,
      walletClient,
      account,
      setAccount: setAccountWithEffect,
      accessToken,
      refreshToken,
      disconnect,
      partnerId,
      error,
      setError,
      network,
      updateAccessToken,
      updateRefreshToken,
    }),
    [
      network,
      serverUrl,
      walletClient,
      account,
      chain,
      accessToken,
      refreshToken,
      disconnect,
      partnerId,
      error,
      setError,
      network,
      updateAccessToken,
      updateRefreshToken,
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

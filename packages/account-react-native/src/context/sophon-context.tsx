import {
  AccountServerURL,
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
import type { WalletProvider } from 'zksync-sso';
import { SophonMainView } from '../components';
import { useUIEventHandler } from '../messaging';
import {
  createWalletProvider,
  SophonAppStorage,
  StorageKeys,
} from '../provider';

export interface SophonContextConfig {
  authServerUrl?: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: WalletProvider;
  token?: string | null;
  disconnect: () => void;
}

export const SophonContext = createContext<SophonContextConfig>({
  chain: sophonTestnet,
  setAccount: () => {},
  disconnect: () => {},
});

export interface SophonAccount {
  address: Address;
}

export const SophonContextProvider = ({
  children,
  network = 'testnet',
  authServerUrl,
}: {
  children: React.ReactNode;
  network: SophonNetworkType;
  authServerUrl?: string;
}) => {
  const serverUrl = useMemo(
    () => authServerUrl ?? AccountServerURL[network],
    [authServerUrl, network],
  );
  const [account, setAccount] = useState<SophonAccount | undefined>(
    SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)
      ? JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)!)
      : undefined,
  );
  // const [token, setToken] = useState<string>();
  const chain = useMemo(
    () => (network === 'mainnet' ? sophon : sophonTestnet),
    [network],
  );
  const provider = useMemo(() => {
    const provider = createWalletProvider(serverUrl, chain);
    return provider;
  }, [serverUrl, chain]);

  const [token, setToken] = useState(
    SophonAppStorage.getItem(StorageKeys.USER_TOKEN),
  );

  useUIEventHandler('setToken', (incomingToken) => {
    SophonAppStorage.setItem(StorageKeys.USER_TOKEN, incomingToken);
    setToken(incomingToken);
  });

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
    transport: custom({
      async request({ method, params }) {
        return await provider?.request({ method, params });
      },
    }),
  });

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
      token,
      disconnect,
    }),
    [network, serverUrl, walletClient, account, chain, token, disconnect],
  );

  useUIEventHandler('logout', () => {
    disconnect();
  });

  return (
    <SophonContext.Provider value={contextValue}>
      <SophonMainView authServerUrl={serverUrl} />
      {children}
    </SophonContext.Provider>
  );
};

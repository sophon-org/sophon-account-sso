'use client';

import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Address, Chain, WalletClient } from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import type { WalletProvider } from 'zksync-sso';
import { SophonAppStorage, StorageKeys } from '../storage/storage';
import { SophonMessageHandler } from './sophon-message-handler';

export interface SophonContextConfig {
  partnerId: string;
  authServerUrl?: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: WalletProvider;
  token?: string | null;
  updateToken: (token: string) => void;
  disconnect: () => void;
  network: SophonNetworkType;
}

export const SophonContext = createContext<SophonContextConfig>({
  partnerId: '',
  chain: sophonTestnet,
  setAccount: () => {},
  updateToken: () => {},
  disconnect: () => {},
  network: 'testnet',
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
}) => {
  const serverUrl = useMemo(
    () => authServerUrl ?? AccountServerURL[network],
    [authServerUrl, network],
  );
  const [account, setAccount] = useState<SophonAccount | undefined>(undefined);
  const [token, setToken] = useState<string>();

  useEffect(() => {
    const context = SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT);
    if (context) {
      setAccount(JSON.parse(context));
    }

    const tokenContext = SophonAppStorage.getItem(StorageKeys.USER_TOKEN);
    if (tokenContext) {
      setToken(tokenContext);
    }
  }, []);

  const chain = useMemo(
    () => (network === 'mainnet' ? sophon : sophonTestnet),
    [network],
  );

  const updateToken = useCallback((newToken: string) => {
    setToken(newToken);
    SophonAppStorage.setItem(StorageKeys.USER_TOKEN, newToken);
  }, []);

  // useUIEventHandler('setToken', (incomingToken) => {
  //   SophonAppStorage.setItem(StorageKeys.USER_TOKEN, incomingToken);
  //   setToken(incomingToken);
  // });

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

  const disconnect = useCallback(() => {
    // await walletClient.disconnect();
    // await provider?.disconnect();
    SophonAppStorage.clear();
    setAccount(undefined);
  }, []);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      mainnet: network === 'mainnet',
      chain,
      authServerUrl: serverUrl,
      account,
      setAccount: setAccountWithEffect,
      token,
      disconnect,
      partnerId,
      network,
      updateToken,
    }),
    [
      network,
      serverUrl,
      account,
      chain,
      token,
      disconnect,
      partnerId,
      setAccountWithEffect,
      updateToken,
    ],
  );

  // useUIEventHandler('logout', () => {
  //   disconnect();
  // });

  return (
    <SophonContext.Provider value={contextValue}>
      <SophonMessageHandler />
      {children}
    </SophonContext.Provider>
  );
};

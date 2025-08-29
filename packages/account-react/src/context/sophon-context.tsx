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
import {
  type Address,
  type Chain,
  createWalletClient,
  custom,
  type WalletClient,
} from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { eip712WalletActions } from 'viem/zksync';
import type { Connector } from 'wagmi';
import type { WalletProvider } from 'zksync-sso';
import { setCookieAuthToken } from '../cookie';
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
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  network: SophonNetworkType;
  connector: Connector;
  updateConnector: (connector: Connector) => void;
}

export const SophonContext = createContext<SophonContextConfig>({
  partnerId: '',
  chain: sophonTestnet,
  setAccount: () => {},
  updateToken: () => {},
  connect: async () => {},
  disconnect: async () => {},
  network: 'testnet',
  connector: null,
  updateConnector: () => {},
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
  const [connector, setConnector] = useState<Connector>();

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
    setCookieAuthToken(newToken);
    setToken(newToken);
    SophonAppStorage.setItem(StorageKeys.USER_TOKEN, newToken);
  }, []);

  const updateConnector = useCallback((newConnector: Connector) => {
    setConnector(newConnector);
  }, []);

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

  const connect = useCallback(async () => {
    const accounts = await connector.connect();
    setAccountWithEffect({ address: accounts.accounts[0] });
  }, [connector, setAccountWithEffect]);

  const walletClient = useMemo(
    () =>
      createWalletClient({
        chain: chain,
        transport: custom({
          async request({ method, params }) {
            // biome-ignore lint/suspicious/noExplicitAny: TODO: revisit the typing
            const provider: any = await connector.getProvider();
            return await provider.request({ method, params });
          },
        }),
      }).extend(eip712WalletActions()),
    [chain, connector],
  );

  const disconnect = useCallback(async () => {
    await connector.disconnect();
    SophonAppStorage.clear();
    setAccount(undefined);
  }, [connector]);

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
      connector,
      connect,
      updateConnector,
      walletClient,
    }),
    [
      network,
      serverUrl,
      account,
      chain,
      token,
      connector,
      connect,
      disconnect,
      partnerId,
      setAccountWithEffect,
      updateToken,
      updateConnector,
      walletClient,
    ],
  );

  return (
    <SophonContext.Provider value={contextValue}>
      <SophonMessageHandler />
      {children}
    </SophonContext.Provider>
  );
};

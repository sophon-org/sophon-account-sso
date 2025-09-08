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
import { type Communicator, PopupCommunicator } from 'zksync-sso/communicator';
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
  token?: { token: string; expiresAt: number } | null;
  updateToken: (token: { token: string; expiresAt: number }) => void;
  refreshToken?: { refreshToken: string; expiresAt: number } | null;
  updateRefreshToken: (refreshToken: {
    refreshToken: string;
    expiresAt: number;
  }) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  network: SophonNetworkType;
  connector: Connector;
  updateConnector: (connector: Connector) => void;
  communicator: Communicator;
}

export const SophonContext = createContext<SophonContextConfig>({
  partnerId: '',
  chain: sophonTestnet,
  setAccount: () => {},
  updateToken: () => {},
  updateRefreshToken: () => {},
  connect: async () => {},
  disconnect: async () => {},
  network: 'testnet',
  connector: null,
  updateConnector: () => {},
  communicator: undefined,
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
  const serverUrl = useMemo(() => {
    const baseUrl = authServerUrl ?? AccountServerURL[network];
    return `${baseUrl}/${partnerId}`;
  }, [authServerUrl, network, partnerId]);

  const communicator = useMemo(() => {
    return new PopupCommunicator(serverUrl, {
      width: 360,
      height: 800,
      calculatePosition(width, height) {
        return {
          left: window.screenX + (window.outerWidth - width) / 2,
          top: window.screenY + (window.outerHeight - height) / 2,
        };
      },
    });
  }, [serverUrl]);
  const [account, setAccount] = useState<SophonAccount | undefined>(undefined);
  const [token, setToken] = useState<{ token: string; expiresAt: number }>();
  const [refreshToken, setRefreshToken] = useState<{
    refreshToken: string;
    expiresAt: number;
  }>();
  const [connector, setConnector] = useState<Connector>();

  useEffect(() => {
    const context = SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT);
    if (context) {
      setAccount(JSON.parse(context));
    }

    const tokenContext = SophonAppStorage.getItem(StorageKeys.USER_TOKEN);
    if (tokenContext) {
      setToken(JSON.parse(tokenContext));
    }

    const refreshTokenContext = SophonAppStorage.getItem(
      StorageKeys.USER_REFRESH_TOKEN,
    );
    if (refreshTokenContext) {
      setRefreshToken(JSON.parse(refreshTokenContext));
    }
  }, []);

  const chain = useMemo(
    () => (network === 'mainnet' ? sophon : sophonTestnet),
    [network],
  );

  const updateToken = useCallback(
    (newToken: { token: string; expiresAt: number }) => {
      setCookieAuthToken(newToken.token);
      setToken(newToken);
      SophonAppStorage.setItem(
        StorageKeys.USER_TOKEN,
        JSON.stringify(newToken),
      );
    },
    [],
  );

  const updateRefreshToken = useCallback(
    (newToken: { refreshToken: string; expiresAt: number }) => {
      setRefreshToken(newToken);
      SophonAppStorage.setItem(
        StorageKeys.USER_REFRESH_TOKEN,
        JSON.stringify(newToken),
      );
    },
    [],
  );

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
    const logoutRequest = {
      id: crypto.randomUUID(),
      content: {
        action: { method: 'wallet_revokePermissions', params: [] },
      },
    };
    communicator?.postMessage(logoutRequest);
    await connector.disconnect();
    SophonAppStorage.clear();
    setAccount(undefined);
  }, [connector, communicator]);

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
      communicator,
      refreshToken,
      updateRefreshToken,
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
      communicator,
      refreshToken,
      updateRefreshToken,
    ],
  );

  return (
    <SophonContext.Provider value={contextValue}>
      <SophonMessageHandler />
      {children}
    </SophonContext.Provider>
  );
};

'use client';

import {
  type Communicator,
  PopupCommunicator,
} from '@sophon-labs/account-communicator';
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
import { eip712WalletActions } from 'viem/zksync';
import type { Connector } from 'wagmi';
import { setCookieAuthToken } from '../cookie';
import { SophonAppStorage, StorageKeys } from '../storage/storage';
import type { SophonJWTToken } from '../types/auth';
import { SophonMessageHandler } from './sophon-message-handler';

export interface SophonContextConfig {
  partnerId: string;
  authServerUrl?: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: EIP1193Provider;
  accessToken?: SophonJWTToken | null;
  updateAccessToken: (data: SophonJWTToken) => void;
  refreshToken?: SophonJWTToken | null;
  updateRefreshToken: (data: SophonJWTToken) => void;
  connect: () => Promise<void>;
  logout: () => Promise<void>;
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
  updateAccessToken: () => {},
  updateRefreshToken: () => {},
  connect: async () => {},
  disconnect: async () => {},
  logout: async () => {},
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
  // biome-ignore lint/correctness/noUnusedFunctionParameters: placeholder for future implementation
  dataScopes = [],
}: {
  children: React.ReactNode;
  network: SophonNetworkType;
  authServerUrl?: string;
  partnerId: string;
  dataScopes?: DataScopes[];
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
  const [accessToken, setAccessToken] = useState<SophonJWTToken>();
  const [refreshToken, setRefreshToken] = useState<SophonJWTToken>();
  const [connector, setConnector] = useState<Connector>();

  useEffect(() => {
    const context = SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT);
    if (context) {
      setAccount(JSON.parse(context));
    }

    const tokenContext = SophonAppStorage.getItem(
      StorageKeys.USER_ACCESS_TOKEN,
    );
    if (tokenContext) {
      setAccessToken(JSON.parse(tokenContext));
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

  const updateAccessToken = useCallback((newToken: SophonJWTToken) => {
    setCookieAuthToken(newToken.value);
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

  const logout = useCallback(async () => {
    const logoutRequest = {
      id: crypto.randomUUID(),
      content: {
        action: { method: 'wallet_revokePermissions', params: [] },
      },
    };
    await communicator?.postMessage(logoutRequest);
    await disconnect();
  }, [communicator, disconnect]);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      mainnet: network === 'mainnet',
      chain,
      authServerUrl: serverUrl,
      account,
      setAccount: setAccountWithEffect,
      accessToken: accessToken,
      disconnect,
      partnerId,
      network,
      updateAccessToken,
      connector,
      connect,
      updateConnector,
      walletClient,
      communicator,
      refreshToken,
      updateRefreshToken,
      logout,
    }),
    [
      network,
      serverUrl,
      account,
      chain,
      accessToken,
      connector,
      connect,
      disconnect,
      partnerId,
      setAccountWithEffect,
      updateAccessToken,
      updateConnector,
      walletClient,
      communicator,
      refreshToken,
      updateRefreshToken,
      logout,
    ],
  );

  return (
    <SophonContext.Provider value={contextValue}>
      <SophonMessageHandler />
      {children}
    </SophonContext.Provider>
  );
};

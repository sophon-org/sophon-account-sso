import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
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

export interface SophonContextConfig {
  partnerId: string;
  authServerUrl?: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: WalletProvider;
  token?: string | null;
  disconnect: () => void;
  hasInternet: boolean;
}

export const SophonContext = createContext<SophonContextConfig>({
  partnerId: '',
  chain: sophonTestnet,
  setAccount: () => {},
  disconnect: () => {},
  hasInternet: false,
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
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const listener = addNetworkStateListener(() => {
      setTimeout(async () => {
        const { isConnected, isInternetReachable } =
          await getNetworkStateAsync();
        setIsConnected(!!isConnected && !!isInternetReachable);
      }, 500);
    });

    return () => {
      listener.remove();
    };
  }, []);

  const serverUrl = useMemo(
    () => authServerUrl ?? AccountServerURL[network],
    [authServerUrl, network],
  );
  const [account, setAccount] = useState<SophonAccount | undefined>(
    SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)
      ? JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT))
      : undefined,
  );
  const chain = useMemo(
    () => (network === 'mainnet' ? sophon : sophonTestnet),
    [network],
  );

  const [token, _setToken] = useState(
    SophonAppStorage.getItem(StorageKeys.USER_TOKEN),
  );

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
      hasInternet: isConnected,
    }),
    [
      network,
      serverUrl,
      account,
      chain,
      token,
      disconnect,
      partnerId,
      isConnected,
      setAccountWithEffect,
    ],
  );

  // useUIEventHandler('logout', () => {
  //   disconnect();
  // });

  return (
    <SophonContext.Provider value={contextValue}>
      {children}
    </SophonContext.Provider>
  );
};

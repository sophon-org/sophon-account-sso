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
  insets,
}: {
  children: React.ReactNode;
  network: SophonNetworkType;
  authServerUrl?: string;
  partnerId: string;
  insets?: SophonMainViewProps['insets'];
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
  }).extend(erc7846Actions());

  const disconnect = useCallback(() => {
    // await walletClient.disconnect();
    provider?.disconnect();
    SophonAppStorage.clear();
    setAccount(undefined);
  }, [provider]);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      chain,
      authServerUrl: serverUrl,
      walletClient,
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
      walletClient,
      account,
      chain,
      token,
      disconnect,
      partnerId,
      isConnected,
    ],
  );

  useUIEventHandler('logout', () => {
    disconnect();
  });

  return (
    <SophonContext.Provider value={contextValue}>
      <SophonMainView
        insets={insets}
        authServerUrl={serverUrl}
        partnerId={partnerId}
        hasInternet={isConnected}
      />
      {children}
    </SophonContext.Provider>
  );
};

import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
// import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network'; // Disabled - was causing WebView recreate
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
import { SophonMainView, type SophonMainViewProps, SafeWebViewWrapper } from '../components';
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
  // 🚀 Global SDK status (shared across all hook instances)
  sdkStatus: {
    isHealthy: boolean;
    lastError: string | null;
    serverReachable: boolean;
    webViewResponsive: boolean;
    connectionState: 'idle' | 'connecting' | 'connected' | 'error';
    lastUpdate: number;
  };
}

export const SophonContext = createContext<SophonContextConfig>({
  partnerId: '',
  chain: sophonTestnet,
  setAccount: () => {},
  disconnect: () => {},
  hasInternet: false,
  // 🚀 Default SDK status
  sdkStatus: {
    isHealthy: true,
    lastError: null,
    serverReachable: true,
    webViewResponsive: true,
    connectionState: 'idle',
    lastUpdate: Date.now(),
  },
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

  // NETWORK LISTENER DISABLED: Was causing WebView to recreate constantly
  /*
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
  */
  
  // Set to true by default to stop WebView recreating
  useEffect(() => {
    setIsConnected(true);
  }, []);

  const serverUrl = useMemo(() => {
    const url = authServerUrl ?? AccountServerURL[network];
    console.log('📍 [CONTEXT-DEBUG] Computing serverUrl:', {
      authServerUrl,
      network,
      result: url,
      timestamp: new Date().toLocaleTimeString()
    });
    return url;
  }, [authServerUrl, network]);
  const [account, setAccount] = useState<SophonAccount | undefined>(
    SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)
      ? JSON.parse(SophonAppStorage.getItem(StorageKeys.USER_ACCOUNT)!)
      : undefined,
  );
  
  // 🚀 Global SDK status (shared across all useSophonAccount instances)
  const [sdkStatus, setSdkStatus] = useState({
    isHealthy: true,
    lastError: null as string | null,
    serverReachable: true,
    webViewResponsive: true,
    connectionState: 'idle' as 'idle' | 'connecting' | 'connected' | 'error',
    lastUpdate: Date.now(),
  });
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
    console.log('🔍 [DISCONNECT-DEBUG] Context disconnect called:', {
      hasProvider: !!provider,
      timestamp: new Date().toLocaleTimeString()
    });
    
    try {
      // await walletClient.disconnect();
      console.log('🔍 [DISCONNECT-DEBUG] Context: Calling provider.disconnect()');
      provider?.disconnect();
      
      console.log('🔍 [DISCONNECT-DEBUG] Context: Clearing storage');
      SophonAppStorage.clear();
      
      console.log('🔍 [DISCONNECT-DEBUG] Context: Setting account to undefined');
      setAccount(undefined);
      
      console.log('✅ [DISCONNECT-DEBUG] Context disconnect completed');
    } catch (error) {
      console.log('🚨 [DISCONNECT-DEBUG] Context disconnect error:', error);
    }
  }, [provider]);

  // 🚀 Handle SDK status updates from WebView
  useUIEventHandler('sdkStatusUpdate', (status) => {
    console.log('🔍 [SDK-STATUS] Global status update:', status);
    setSdkStatus(status);
  });

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
      sdkStatus, // ← Global SDK status shared by all hook instances
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
      sdkStatus, // ← Add sdkStatus to dependencies
    ],
  );

  useUIEventHandler('logout', () => {
    console.log('🔍 [DISCONNECT-DEBUG] Logout UI event received - calling context disconnect');
    disconnect();
  });

  return (
    <SophonContext.Provider value={contextValue}>
      <SafeWebViewWrapper 
        onError={(error, errorInfo) => {
          // ✅ Use console.log to avoid triggering red screen from Error Boundary
          console.log('🚨 [CRASH-DEBUG] SophonMainView crashed, gracefully handled by Error Boundary:', {
            error: error.message,
            componentStack: errorInfo.componentStack?.slice(0, 200) || 'No stack trace'
          });
        }}
      >
        <SophonMainView
          insets={insets}
          authServerUrl={serverUrl}
          partnerId={partnerId}
        />
      </SafeWebViewWrapper>
      {children}
    </SophonContext.Provider>
  );
};

import '../pollyfills';
import type { Message } from '@sophon-labs/account-communicator';
// everything else
import {
  AccountServerURL,
  type ChainId,
  type DataScopes,
  SophonChains,
  sophonActions,
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
  type CustomTransport,
  createWalletClient,
  custom,
} from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { erc7846Actions } from 'viem/experimental';
import { eip712WalletActions } from 'viem/zksync';
import { useEmbeddedAuth } from '../auth/useAuth';
import { AuthPortal, type AuthPortalProps } from '../auth-portal';
import type { Capabilities } from '../lib/capabilities';
import { dynamicClient } from '../lib/dynamic';
import { useUIEventHandler } from '../messaging';
import {
  createMobileProvider,
  SophonAppStorage,
  StorageKeys,
} from '../provider';
import { freshInstallActions } from '../provider/fresh-install';
import type { SophonJWTToken } from '../types';

export const createSophonWalletClient = (
  chain: Chain,
  transport: CustomTransport,
) =>
  // @ts-ignore
  createWalletClient({
    chain,
    transport,
  })
    .extend(erc7846Actions())
    .extend(eip712WalletActions())
    .extend(sophonActions());

export type SophonWalletClient = ReturnType<typeof createSophonWalletClient>;

export interface Consent {
  ads: boolean;
  data: boolean;
}

export interface SophonContextConfig {
  initialized: boolean;
  partnerId: string;
  authServerUrl?: string;
  walletClient?: SophonWalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  connectingAccount?: SophonAccount;
  setConnectingAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: EIP1193Provider;
  chainId: ChainId;
  accessToken?: SophonJWTToken | null;
  refreshToken?: SophonJWTToken | null;
  updateAccessToken: (data: SophonJWTToken) => void;
  updateRefreshToken: (data: SophonJWTToken) => void;
  logout: () => Promise<void>;
  error?: { description: string; code: number };
  setError: (error: { description: string; code: number }) => void;
  insets?: AuthPortalProps['insets'];
  currentRequest?: Message;
  setCurrentRequest: (request?: Message) => void;
  capabilities: Capabilities[];
}

export const SophonContext = createContext<SophonContextConfig>({
  initialized: false,
  partnerId: '',
  chain: sophonTestnet,
  setAccount: () => {},
  setConnectingAccount: () => {},
  chainId: sophonTestnet.id,
  updateAccessToken: () => {},
  updateRefreshToken: () => {},
  logout: async () => {},
  error: undefined,
  setError: (_: { description: string; code: number }) => {},
  currentRequest: undefined,
  setCurrentRequest: () => {},
  capabilities: [],
});

export interface SophonAccount {
  address: Address;
  owner: Address;
}

export const SophonContextProvider = ({
  children,
  chainId = sophonTestnet.id,
  authServerUrl,
  partnerId,
  dataScopes,
  insets,
  requestedCapabilities,
}: {
  children: React.ReactNode;
  chainId: ChainId;
  authServerUrl?: string;
  partnerId: string;
  dataScopes: DataScopes[];
  insets?: AuthPortalProps['insets'];
  requestedCapabilities?: Capabilities[];
}) => {
  const [error, setError] = useState<{ description: string; code: number }>();
  const serverUrl = useMemo(
    () => authServerUrl ?? AccountServerURL[chainId],
    [authServerUrl, chainId],
  );
  const [account, setAccount] = useState<SophonAccount | undefined>();
  const [currentRequest, setCurrentRequest] = useState<Message | undefined>();

  const [initialized, setInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState<SophonJWTToken | undefined>();
  const [refreshToken, setRefreshToken] = useState<
    SophonJWTToken | undefined
  >();
  const [connectingAccount, setConnectingAccount] = useState<
    SophonAccount | undefined
  >();
  const { logout: logoutEmbedded } = useEmbeddedAuth();
  const chain = useMemo(() => SophonChains[chainId], [chainId]);
  const provider = useMemo(() => {
    const provider = createMobileProvider(serverUrl, chainId);
    return provider;
  }, [serverUrl, chain]);
  const capabilities = useMemo<Capabilities[]>(
    () => requestedCapabilities ?? [],
    [requestedCapabilities],
  );

  const walletClient = createSophonWalletClient(chain, custom(provider));

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

  useUIEventHandler('handleError', setError);

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

  const logout = useCallback(async () => {
    await logoutEmbedded();
    await provider?.disconnect();
    setAccount(undefined);
    SophonAppStorage.clear();
  }, [logoutEmbedded, provider, setAccount]);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      initialized,
      mainnet: chainId === sophon.id,
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
      chainId,
      updateAccessToken,
      updateRefreshToken,
      logout,
      currentRequest,
      setCurrentRequest,
      connectingAccount,
      setConnectingAccount,
      capabilities,
    }),
    [
      initialized,
      chainId,
      serverUrl,
      walletClient,
      account,
      chain,
      accessToken,
      refreshToken,
      partnerId,
      error,
      setError,
      chainId,
      updateAccessToken,
      updateRefreshToken,
      logout,
      currentRequest,
      setCurrentRequest,
      connectingAccount,
      setConnectingAccount,
      capabilities,
    ],
  );

  useUIEventHandler('logout', () => {
    logout();
  });

  return (
    <SophonContext.Provider value={contextValue}>
      {children}
      <dynamicClient.reactNative.WebView />
      <AuthPortal
        insets={insets}
        scopes={dataScopes}
        authServerUrl={serverUrl}
        partnerId={partnerId}
      />
    </SophonContext.Provider>
  );
};

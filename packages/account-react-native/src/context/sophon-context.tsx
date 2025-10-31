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
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { AuthPortal, type AuthPortalProps } from '../auth-portal';
import { LocalizationProvider, type SupportedLocaleCode } from '../i18n';
import type { Capabilities } from '../lib/capabilities';
import {
  createDynamicClient,
  type DynamicClientType,
  NoopDynamicClient,
} from '../lib/dynamic';
import { type SophonUIActions, useUIEventHandler } from '../messaging';
import {
  createMobileProvider,
  SophonAppStorage,
  StorageKeys,
} from '../provider';
import { freshInstallActions } from '../provider/fresh-install';
import type { SophonJWTToken } from '../types';
import { ThemeProvider } from '../ui/theme-provider';

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
  error?: { description: string; code: number };
  setError: (error: { description: string; code: number }) => void;
  insets?: AuthPortalProps['insets'];
  currentRequest?: Message;
  currentRequestId: MutableRefObject<Message['id'] | undefined>;
  setCurrentRequest: (request?: Message) => void;
  capabilities: Capabilities[];
  dynamicClient: DynamicClientType;
  requiresAuthorization: boolean;
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
  error: undefined,
  setError: (_: { description: string; code: number }) => {},
  currentRequest: undefined,
  setCurrentRequest: () => {},
  capabilities: [],
  dynamicClient: NoopDynamicClient,
  requiresAuthorization: false,
  currentRequestId: { current: undefined } as MutableRefObject<
    Message['id'] | undefined
  >,
});

export interface SophonAccount {
  address: Address;
  owner: Address;
}

export type SophonContextEvents = {
  onLoginSuccess?: (payload: SophonUIActions['onLoginSuccess']) => void;
  onLogout?: (payload: SophonUIActions['onLogout']) => void;
};

interface SophonContextProviderProps {
  children: React.ReactNode;
  chainId: ChainId;
  authServerUrl?: string;
  partnerId: string;
  dataScopes?: DataScopes[];
  insets?: AuthPortalProps['insets'];
  requestedCapabilities?: Capabilities[];

  /**
   * Locale code for internationalization.
   * @default "en"
   * @supported "en" | "es"
   */
  locale?: SupportedLocaleCode;

  /**
   * Theme mode
   * @default "system"
   * @supported "light" | "dark"
   */
  theme?: 'light' | 'dark';

  events?: SophonContextEvents;
}

export const SophonContextProvider = ({
  children,
  chainId = sophonTestnet.id,
  authServerUrl,
  partnerId,
  dataScopes = [],
  insets,
  requestedCapabilities,
  locale,
  theme,
  events,
}: SophonContextProviderProps) => {
  const [error, setError] = useState<{ description: string; code: number }>();
  const serverUrl = useMemo(
    () => authServerUrl ?? AccountServerURL[chainId],
    [authServerUrl, chainId],
  );
  const [account, setAccount] = useState<SophonAccount | undefined>();
  const [currentRequest, setCurrentRequest] = useState<Message | undefined>();
  const currentRequestId = useRef<Message['id'] | undefined>();
  const [initialized, setInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState<SophonJWTToken | undefined>();
  const [refreshToken, setRefreshToken] = useState<
    SophonJWTToken | undefined
  >();
  const [connectingAccount, setConnectingAccount] = useState<
    SophonAccount | undefined
  >();
  const chain = useMemo(() => SophonChains[chainId], [chainId]);
  const provider = useMemo(() => {
    const provider = createMobileProvider(serverUrl, chainId);
    return provider;
  }, [serverUrl, chainId]);
  const capabilities = useMemo<Capabilities[]>(
    () => requestedCapabilities ?? [],
    [requestedCapabilities],
  );

  const requiresAuthorization = useMemo(
    () => !!dataScopes?.length,
    [dataScopes],
  );
  const [dynamicClient, setDynamicClient] =
    useState<DynamicClientType>(NoopDynamicClient);

  const walletClient = useMemo(
    () => createSophonWalletClient(chain, custom(provider)),
    [chain, provider],
  );

  const setCurrentRequestWithEffect = useCallback((request?: Message) => {
    setCurrentRequest(request);
    currentRequestId.current = request?.id;
  }, []);

  useEffect(() => {
    setDynamicClient(createDynamicClient(chainId));
  }, [chainId]);

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

  useUIEventHandler('onLoginSuccess', (payload) => {
    events?.onLoginSuccess?.(payload);
  });

  useUIEventHandler('onLogout', (payload) => {
    events?.onLogout?.(payload);
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

  if (!SophonChains[chainId]) {
    throw new Error(`Chain ${chainId} is not supported`);
  }

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
      currentRequest,
      setCurrentRequest: setCurrentRequestWithEffect,
      connectingAccount,
      setConnectingAccount,
      capabilities,
      dynamicClient,
      requiresAuthorization,
      currentRequestId,
    }),
    [
      initialized,
      serverUrl,
      walletClient,
      account,
      chain,
      accessToken,
      refreshToken,
      partnerId,
      error,
      chainId,
      updateAccessToken,
      updateRefreshToken,
      currentRequest,
      connectingAccount,
      capabilities,
      dynamicClient,
      requiresAuthorization,
      setAccountWithEffect,
      setCurrentRequestWithEffect,
    ],
  );

  return (
    <SophonContext.Provider value={contextValue}>
      {children}
      {!!dynamicClient?.reactNative?.WebView && (
        <dynamicClient.reactNative.WebView />
      )}
      <ThemeProvider theme={theme}>
        <LocalizationProvider locale={locale}>
          <AuthPortal
            insets={insets}
            scopes={dataScopes}
            authServerUrl={serverUrl}
            partnerId={partnerId}
          />
        </LocalizationProvider>
      </ThemeProvider>
    </SophonContext.Provider>
  );
};

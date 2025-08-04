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
import { createWalletProvider, SophonAppStorage } from '../provider';

export interface SophonContextConfig {
  authServerUrl?: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: WalletProvider;
  token?: string;
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
  const [account, setAccount] = useState<SophonAccount>();
  const [token, setToken] = useState<string>();
  const chain = useMemo(
    () => (network === 'mainnet' ? sophon : sophonTestnet),
    [network],
  );
  const provider = useMemo(() => {
    const provider = createWalletProvider(serverUrl, chain);
    return provider;
  }, [serverUrl, chain]);

  useUIEventHandler('setToken', (incomingToken) => {
    setToken(incomingToken);
  });

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
      setAccount,
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

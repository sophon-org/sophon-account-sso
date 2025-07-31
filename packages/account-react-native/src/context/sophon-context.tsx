import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { createContext, useMemo, useState } from 'react';
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
import { createWalletProvider } from '../provider';
import { useUIEventHandler } from '../messaging';

export interface SophonContextConfig {
  serverUrl: string;
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: WalletProvider;
  token?: string;
}

export const SophonContext = createContext<SophonContextConfig>({
  chain: sophonTestnet,
  serverUrl: 'http://localhost:3000/embedded',
  setAccount: () => {},
});

export interface SophonAccount {
  address: Address;
}

export const SophonContextProvider = ({
  children,
  network,
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

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      mainnet: network === 'mainnet',
      chain,
      authServerUrl: serverUrl,
      walletClient,
      account,
      setAccount,
      serverUrl,
      token,
    }),
    [network, serverUrl, walletClient, account, chain, token],
  );

  return (
    <SophonContext.Provider value={contextValue}>
      <SophonMainView />
      {children}
    </SophonContext.Provider>
  );
};

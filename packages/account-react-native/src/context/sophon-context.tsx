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
import { createWalletProvider } from '../provider';

export interface SophonContextConfig {
  walletClient?: WalletClient;
  account?: SophonAccount;
  setAccount: (account?: SophonAccount) => void;
  chain: Chain;
  provider?: WalletProvider;
}

export const SophonContext = createContext<SophonContextConfig>({
  chain: sophonTestnet,
  setAccount: () => {},
});

export interface SophonAccount {
  address: Address;
  jwt: string;
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
  const [account, setAccount] = useState<SophonAccount>();
  const chain = useMemo(
    () => (network === 'mainnet' ? sophon : sophonTestnet),
    [network],
  );
  const provider = useMemo(() => {
    const provider = createWalletProvider(
      authServerUrl ?? AccountServerURL[network],
      chain,
    );
    return provider;
  }, [authServerUrl, chain, network]);

  const walletClient = createWalletClient({
    chain: chain,
    transport: custom({
      async request({ method, params }) {
        return await provider?.request({ method, params });
      },
    }),
  });
  // }, [provider, chain]);

  const contextValue = useMemo<SophonContextConfig>(
    () => ({
      mainnet: network === 'mainnet',
      chain,
      authServerUrl: authServerUrl ?? AccountServerURL[network],
      walletClient,
      account,
      setAccount,
    }),
    [network, authServerUrl, walletClient, account, chain],
  );

  return (
    <SophonContext.Provider value={contextValue}>
      {children}
    </SophonContext.Provider>
  );
};

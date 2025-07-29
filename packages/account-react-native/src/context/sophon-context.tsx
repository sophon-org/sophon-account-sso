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
  isMainnet,
  authServerUrl,
}: {
  children: React.ReactNode;
  isMainnet?: boolean;
  authServerUrl?: string;
}) => {
  const [account, setAccount] = useState<SophonAccount>();
  const chain = useMemo(
    () => (isMainnet ? sophon : sophonTestnet),
    [isMainnet],
  );
  const provider = useMemo(() => {
    const provider = createWalletProvider(
      authServerUrl ?? 'http://localhost:3000',
      chain,
    );
    return provider;
  }, [authServerUrl, chain]);

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
      mainnet: isMainnet ?? false,
      chain,
      authServerUrl: authServerUrl ?? 'http://localhost:3000',
      walletClient,
      account,
      setAccount,
    }),
    [isMainnet, authServerUrl, walletClient, account, chain],
  );

  return (
    <SophonContext.Provider value={contextValue}>
      {children}
    </SophonContext.Provider>
  );
};

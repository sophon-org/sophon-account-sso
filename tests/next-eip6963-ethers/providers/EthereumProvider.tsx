'use client';

import {
  createSophonEIP6963Emitter,
  type EIP1193Provider,
} from '@sophon-labs/account-eip6963';
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BrowserProvider, type Signer } from 'zksync-ethers';
import type { Chain, EthereumContextValue } from '@/types';
import { getSophonEIP6963Connector } from '../lib/eip6963';

createSophonEIP6963Emitter(
  'testnet',
  process.env.NEXT_PUBLIC_ACCOUNT_SERVER_URL,
);

export const EthereumContext = createContext<EthereumContextValue | null>(null);

const ACCOUNT_KEY = 'ethers::account';

export default function EthereumProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [account, setAccount] = useState<
    | { isConnected: true; address: string }
    | { isConnected: false; address: null }
  >({ isConnected: false, address: null });
  const [network, setNetwork] = useState<Chain | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [browserProvider, setBrowserProvider] =
    useState<BrowserProvider | null>(null);
  const [provider, setProvider] = useState<EIP1193Provider | null>(null);

  const connect = useCallback(async () => {
    const sophonProvider = await getSophonEIP6963Connector();

    if (!sophonProvider) {
      console.error('❌ No provider available');
      throw new Error('No injected wallets found');
    }

    setProvider(sophonProvider);

    const browserProvider = new BrowserProvider(sophonProvider);
    setBrowserProvider(browserProvider);

    const signer = await browserProvider.getSigner();
    if (!signer) {
      console.error('❌ No signer available');
      throw new Error('No signer available');
    }

    // Make sure to initialize on L2
    await browserProvider.getNetwork();

    setSigner(signer);
    setAccount({
      isConnected: true,
      address: signer.address,
    });
    localStorage.setItem(
      ACCOUNT_KEY,
      JSON.stringify({
        address: signer.address,
      }),
    );
  }, []);

  useEffect(() => {
    const context = localStorage.getItem(ACCOUNT_KEY);
    if (context) {
      setAccount(JSON.parse(context));
      connect();
    }
  }, [connect]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(ACCOUNT_KEY);
    provider?.request({
      method: 'wallet_revokePermissions',
      params: [],
    });
    setSigner(null);
    setAccount({
      isConnected: false,
      address: null,
    });
    setNetwork(null);
    setProvider(null);
  }, [provider]);

  const value = useMemo(
    () => ({
      account,
      network,
      connect,
      disconnect,
      signer,
      provider,
      browserProvider,
    }),
    [account, network, connect, disconnect, signer, provider, browserProvider],
  );

  return (
    <EthereumContext.Provider value={value}>
      {children}
    </EthereumContext.Provider>
  );
}

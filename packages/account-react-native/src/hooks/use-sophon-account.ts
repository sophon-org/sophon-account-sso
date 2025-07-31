import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { SophonAppStorage } from '../provider';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const { walletClient, setAccount, provider, account } = useSophonContext();

  const connect = useCallback(async () => {
    const addresses = await walletClient!.requestAddresses();
    setAccount({
      address: addresses[0] as Address,
    });
  }, [walletClient, setAccount]);

  const disconnect = useCallback(async () => {
    await provider?.disconnect();
    SophonAppStorage.clear();
    setAccount(undefined);
  }, [provider, setAccount]);

  const isConnected = useMemo(() => !!account, [account]);

  return {
    isConnected,
    connect,
    disconnect,
    account,
    provider,
    walletClient,
  };
};

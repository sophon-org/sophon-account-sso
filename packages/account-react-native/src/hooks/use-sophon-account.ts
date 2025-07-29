import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const { walletClient, setAccount, provider, account } = useSophonContext();

  const connect = useCallback(async () => {
    const addresses = await walletClient!.requestAddresses();
    setAccount({
      address: addresses[0] as Address,
      // TODO: return proper jwt
      jwt: '4507f8a7594b1094a3a26439a0379a42a1d0caf97890dbe7ba8f8ab3c461581b=',
    });
  }, [walletClient, setAccount]);

  const disconnect = useCallback(async () => {
    await provider?.disconnect();
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

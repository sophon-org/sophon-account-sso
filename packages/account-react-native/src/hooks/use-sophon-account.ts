import { useCallback, useMemo, useState } from 'react';
import type { Address } from 'viem';
import { sendUIMessage } from '../messaging';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const { walletClient, setAccount, provider, account, disconnect } =
    useSophonContext();
  const [error, setError] = useState<string>();

  const connect = useCallback(async () => {
    try {
      setError(undefined);
      const addresses = await walletClient!.requestAddresses();
      console.log('addresses', addresses);
      if (addresses.length === 0) {
        throw new Error('No addresses found');
      }
      setAccount({
        address: addresses[0] as Address,
      });
    } catch (error: any) {
      setAccount(undefined);
      setError(error.details ?? error.message);
    }
  }, [walletClient, setAccount]);

  const isConnected = useMemo(() => !!account, [account]);

  const showProfile = useCallback(async () => {
    if (account) {
      sendUIMessage('showModal', {});
    }
  }, [account]);

  return {
    isConnected,
    connect,
    disconnect,
    account,
    provider,
    walletClient,
    showProfile,
    error,
  };
};

import { useCallback, useMemo, useState } from 'react';
import type { Address } from 'viem';
import type { CustomRPCError } from '@/types';
import { sendUIMessage } from '../messaging';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const {
    initialized,
    walletClient,
    setAccount,
    provider,
    account,
    error,
    logout,
    disconnect,
  } = useSophonContext();
  const [accountError, setAccountError] = useState<string>();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);

    // to make sure that we have no cached account, before connecting we force a local disconnect
    try {
      await disconnect();
      sendUIMessage('clearMainViewCache', {});
    } catch {}

    try {
      setAccountError(undefined);
      const addresses = await walletClient!.requestAddresses();
      if (addresses.length === 0) {
        throw new Error('No addresses found');
      }
      setAccount({
        address: addresses[0] as Address,
      });
    } catch (error: unknown) {
      setAccount(undefined);
      setAccountError(
        (error as CustomRPCError).details ?? (error as CustomRPCError).message,
      );
    } finally {
      setIsConnecting(false);
    }
  }, [walletClient, setAccount]);

  // Make sure to only return that the user is connected after
  // context initialization is complete, that way we make sure that
  // we don't load  cached stuff from previous installation
  const isConnected = useMemo(
    () => !!account && initialized,
    [account, initialized],
  );

  return {
    initialized,
    isConnected,
    connect,
    logout,
    account,
    provider,
    walletClient,
    accountError: accountError ?? error,
    isConnecting,
  };
};

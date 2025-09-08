import { useCallback, useMemo, useState } from 'react';
import type { Address } from 'viem';
import type { CustomRPCError } from '@/types';
import { sendUIMessage } from '../messaging';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const { walletClient, setAccount, provider, account, disconnect, error } =
    useSophonContext();
  const [accountError, setAccountError] = useState<string>();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setAccountError(undefined);
      const addresses = await walletClient!.requestAddresses();
      console.log('addresses', addresses);
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
    accountError: accountError ?? error,
    isConnecting,
  };
};

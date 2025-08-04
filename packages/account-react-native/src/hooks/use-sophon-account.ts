import { useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import { sendUIMessage } from '../messaging';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const { walletClient, setAccount, provider, account, disconnect } =
    useSophonContext();

  const connect = useCallback(async () => {
    const addresses = await walletClient!.requestAddresses();
    setAccount({
      address: addresses[0] as Address,
    });
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
  };
};

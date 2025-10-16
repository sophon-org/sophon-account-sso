import { useCallback, useMemo, useState } from 'react';
// import type { Address } from 'viem';
// import { sendUIMessage } from '../messaging';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const {
    initialized,
    walletClient,
    // setAccount,
    provider,
    account,
    error,
    logout,
  } = useSophonContext();
  const [accountError, setAccountError] = useState<{
    description: string;
    code: number;
  }>();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);

    // to make sure that we have no cached account, before connecting we force a local disconnect
    // try {
    //   // await disconnect();
    //   // sendUIMessage('clearMainViewCache', {});
    // } catch {}

    try {
      setAccountError(undefined);
      const addresses = await walletClient!.requestAddresses();
      if (addresses.length === 0) {
        throw new Error('No addresses found');
      }
      console.log('addresses', addresses);
      // setAccount({
      //   address: addresses[0] as Address,
      // });
      // biome-ignore lint/suspicious/noExplicitAny: Better typing is not possible at the moment
    } catch (error: any) {
      // setAccount(undefined);
      setAccountError({
        description: error.details ?? error.message,
        code: error.code,
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [walletClient]);

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

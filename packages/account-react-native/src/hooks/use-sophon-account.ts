import { useCallback, useMemo, useState } from 'react';
import { sendUIMessage } from '../messaging';
import { SophonAppStorage } from '../provider';
import { useEmbeddedAuth } from './use-embedded-auth';
import { useSophonContext } from './use-sophon-context';

export const useSophonAccount = () => {
  const {
    initialized,
    walletClient,
    setAccount,
    provider,
    account,
    error,
    setConnectingAccount,
  } = useSophonContext();
  const [accountError, setAccountError] = useState<{
    description: string;
    code: number;
  }>();
  const [isConnecting, setIsConnecting] = useState(false);
  const { logout: logoutEmbedded } = useEmbeddedAuth();

  const logout = useCallback(async () => {
    await Promise.all([
      logoutEmbedded(),
      walletClient?.disconnect(),
      provider?.disconnect(),
    ]);

    setConnectingAccount(undefined);
    setAccount(undefined);
    SophonAppStorage.clear();
    sendUIMessage('onLogout', undefined);
  }, [
    logoutEmbedded,
    provider,
    setAccount,
    walletClient,
    setConnectingAccount,
  ]);

  const connect = useCallback(async () => {
    setIsConnecting(true);

    try {
      // make sure that if there are any error that prevents the user to finish the flow
      // we won't block new connections on the embedded provider
      await logout();

      setAccountError(undefined);
      const addresses = await walletClient!.requestAddresses();
      if (addresses.length === 0) {
        throw new Error('No addresses found');
      }

      return addresses;
      // biome-ignore lint/suspicious/noExplicitAny: Better typing is not possible at the moment
    } catch (error: any) {
      setAccount(undefined);
      setAccountError({
        description: error.details ?? error.message,
        code: error.code,
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [walletClient, logout, setAccount]);

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

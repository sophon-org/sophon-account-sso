import { useMemo } from 'react';
import { useSophonContext } from './useSophonContext';

/**
 * Hook that handle information regading the current user account information
 *
 * @returns a set of properties and actions to handle sophon account
 */
export const useSophonAccount = () => {
  const { provider, account, connect, disconnect, logout } = useSophonContext();

  const isConnected = useMemo(() => !!account, [account]);

  return {
    isConnected,
    account,
    provider,
    connect,
    disconnect,
    logout,
  };
};

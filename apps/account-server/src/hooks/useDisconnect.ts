'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useWalletConnection } from '@/hooks/useWalletConnection';

/**
 * Handles the logout from the account context and any other context, like dynamic
 * @returns A function to handle the logout
 */
export const useAccountDisconnect = () => {
  const actorRef = MainStateMachineContext.useActorRef();
  const { logout } = useAccountContext();
  const { handleLogOut, user } = useDynamicContext();
  const { disconnect } = useWalletConnection();

  const handleDisconnect = useCallback(async () => {
    if (user) {
      await handleLogOut();
    }

    disconnect();
    logout();
    actorRef.send({ type: 'LOGOUT' });
  }, [disconnect, logout, handleLogOut, user, actorRef]);

  return handleDisconnect;
};

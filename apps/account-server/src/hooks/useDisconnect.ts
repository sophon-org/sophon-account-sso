'use client';

import { useCallback } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useWalletConnection } from '@/hooks/useWalletConnection';

/**
 * Handles the logout from the account context and any other context, like openfort
 * @returns A function to handle the logout
 */
export const useAccountDisconnect = () => {
  const actorRef = MainStateMachineContext.useActorRef();
  const { logout } = useAccountContext();
  const { disconnect } = useWalletConnection();

  const handleDisconnect = useCallback(async () => {
    disconnect();
    logout();
    actorRef.send({ type: 'LOGOUT' });
  }, [disconnect, logout, actorRef]);

  return handleDisconnect;
};

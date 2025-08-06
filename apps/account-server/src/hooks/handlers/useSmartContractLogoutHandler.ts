'use client';

import { useEventHandler } from '@/events/hooks';
import { useAccountDisconnect } from '@/hooks/useDisconnect';
import { windowService } from '@/service/window.service';
import { useAccountContext } from '../useAccountContext';

/**
 * Handle the logout when explicitly solicited by the user
 */
export const useSmartContractLogoutHandler = () => {
  const disconnect = useAccountDisconnect();
  const { setAccount } = useAccountContext();

  useEventHandler('smart-contract.logout', () => {
    setAccount(null);
    disconnect();
    windowService.logout();
  });
};

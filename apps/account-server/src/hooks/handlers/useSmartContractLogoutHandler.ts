'use client';

import { useEventHandler } from '@/events/hooks';
import { useAccountDisconnect } from '@/hooks/useDisconnect';
import { windowService } from '@/service/window.service';

/**
 * Handle the logout when explicitly solicited by the user
 */
export const useSmartContractLogoutHandler = () => {
  const disconnect = useAccountDisconnect();

  useEventHandler('smart-contract.logout', () => {
    disconnect();
    windowService.logout();
  });
};

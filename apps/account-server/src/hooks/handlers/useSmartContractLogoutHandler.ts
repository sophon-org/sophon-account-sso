'use client';

import { sendMessageToRN } from '@sophon-labs/account-message-bridge';
import { useEventHandler } from '@/events/hooks';
import { useAccountDisconnect } from '@/hooks/useDisconnect';

/**
 * Handle the logout when explicitly solicited by the user
 */
export const useSmartContractLogoutHandler = () => {
  const disconnect = useAccountDisconnect();

  useEventHandler('smart-contract.logout', () => {
    disconnect();
    sendMessageToRN('logout', null);
  });
};

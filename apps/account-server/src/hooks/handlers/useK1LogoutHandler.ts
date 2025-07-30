'use client';

import { useEventHandler } from '@/events/hooks';

/**
 * Handle the logout when the user got disconnected from dynamic side,
 * for now we do nothing, ideally we should not disconnect the user and re-login
 */
export const useK1LogoutHandler = () => {
  useEventHandler('k1.logout', () => {
    console.log('🔥 k1.logout');
    // handleDisconnect();
  });
};

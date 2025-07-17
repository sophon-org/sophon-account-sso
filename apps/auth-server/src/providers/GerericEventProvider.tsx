'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback } from 'react';
import { type AuthServerActions, useAuthHandler } from '../lib/events';

export const GenericEventProvider = () => {
  const { user, handleLogOut } = useDynamicContext();

  const handleLogout = useCallback(
    (payload: AuthServerActions['logout']) => {
      console.log('🔥 logout', payload);
      if (user) {
        console.log('called dynamic logout function, user:', user);
        handleLogOut();
      }
    },
    [user, handleLogOut],
  );

  useAuthHandler('logout', handleLogout);

  return null;
};

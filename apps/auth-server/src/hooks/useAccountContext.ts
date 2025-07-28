'use client';
import { useContext } from 'react';
import { AccountContext } from '@/context/account-context';

/**
 * Expose Sophon Account context for react components in the form of webhook
 * @returns
 */
export const useAccountContext = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error(
      "Sophon's useAccountContext must be used within a AccountContextProvider",
    );
  }
  return context;
};

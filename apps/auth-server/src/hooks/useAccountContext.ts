'use client';
import { useContext } from 'react';
import { AccountContext } from '@/context/account-context';

export const useAccountContext = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error(
      'useAccountContext must be used within a AccountContextProvider',
    );
  }
  return context;
};

'use client';
import type { Wallet } from '@dynamic-labs/sdk-react-core';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LOCAL_STORAGE_KEY } from '@/lib/constants';
import { sendAuthMessage } from '@/lib/events';
import type { SmartAccount } from '@/types/smart-account';

interface AccountContextProps {
  account: SmartAccount | null;
  setAccount: (account: SmartAccount | null) => void;
  login: (account: SmartAccount, dynamicWallet?: Wallet) => Promise<void>;
  logout: () => void;
  dynamicWallet: Wallet | null;
  setDynamicWallet: (wallet: Wallet | null) => void;
}

const AccountContext = createContext<AccountContextProps | null>(null);

const AccountContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [account, setAccount] = useState<SmartAccount | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dynamicWallet, setDynamicWallet] = useState<Wallet | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAccount(parsed);
      }
    } catch (error) {
      console.warn('Failed to load account from storage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage whenever accountData changes
  useEffect(() => {
    if (!isInitialized) return;

    try {
      if (account) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(account));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to save account to storage:', error);
    }
  }, [account, isInitialized]);

  const login = useCallback(
    async (
      data: SmartAccount,
      wallet?: Wallet,
      externalLogout?: () => void,
    ) => {
      setAccount(data);
      setDynamicWallet(wallet ?? null);
      externalLogout?.();
    },
    [],
  );

  const logout = useCallback(() => {
    sendAuthMessage('logout', {
      address: account?.address ?? '0x0000000000000000000000000000000000000000',
    });
    setAccount(null);
  }, [account?.address]);

  const contextValue = useMemo<AccountContextProps>(
    () => ({
      account,
      setAccount,
      login,
      logout,
      dynamicWallet,
      setDynamicWallet,
    }),
    [account, login, logout, dynamicWallet],
  );

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
};

export { AccountContextProvider, AccountContext };

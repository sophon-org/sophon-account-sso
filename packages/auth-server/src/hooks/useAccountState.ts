"use client";
import { useState, useEffect, useCallback } from "react";
import { type Address, type Hash, toBytes } from "viem";

type SmartAccount = {
  username: string;
  address: Address;
  passkey: Hash;
};

type AccountChangeListener = (address: Address | null) => void;

// Simple observable implementation
class AccountObservable {
  private listeners: AccountChangeListener[] = [];

  subscribe(listener: AccountChangeListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify(address: Address | null) {
    this.listeners.forEach((listener) => listener(address));
  }
}

const accountObservable = new AccountObservable();

export const useAccountStore = () => {
  const [accountData, setAccountData] = useState<SmartAccount | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sophon-account");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAccountData(parsed);
      }
    } catch (error) {
      console.warn("Failed to load account from storage:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage whenever accountData changes
  useEffect(() => {
    if (!isInitialized) return;

    try {
      if (accountData) {
        localStorage.setItem("sophon-account", JSON.stringify(accountData));
      } else {
        localStorage.removeItem("sophon-account");
      }
      // Notify observers of address change
      accountObservable.notify(accountData?.address || null);
    } catch (error) {
      console.warn("Failed to save account to storage:", error);
    }
  }, [accountData, isInitialized]);

  // Computed values
  const address = accountData?.address || null;
  const passkey = accountData?.passkey ? toBytes(accountData.passkey) : null;
  const username = accountData?.username || null;
  const isLoggedIn = !!address;

  // Actions
  const login = useCallback((data: SmartAccount) => {
    setAccountData(data);
  }, []);

  const logout = useCallback(() => {
    setAccountData(null);
  }, []);

  // Observable subscription
  const subscribeOnAccountChange = useCallback(
    (listener: AccountChangeListener) => {
      return accountObservable.subscribe(listener);
    },
    []
  );

  return {
    address,
    passkey,
    username,
    isLoggedIn,
    isInitialized,
    subscribeOnAccountChange,
    login,
    logout,
  };
};

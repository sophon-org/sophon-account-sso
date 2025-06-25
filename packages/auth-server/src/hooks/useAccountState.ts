"use client";
import { useState, useEffect, useCallback } from "react";
import { type Address, type Hash, toBytes } from "viem";

type SmartAccount = {
  username: string;
  address: Address;
  passkey?: Hash | null; // Make passkey optional for EOA accounts
  privateKey?: string | null; // Add privateKey support for EOA accounts
  accountType?: "passkey" | "eoa"; // Track account type
};

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
    } catch (error) {
      console.warn("Failed to save account to storage:", error);
    }
  }, [accountData, isInitialized]);

  // Computed values
  const address = accountData?.address || null;
  const passkey = accountData?.passkey ? toBytes(accountData.passkey) : null;
  const privateKey = accountData?.privateKey || null;
  const accountType = accountData?.accountType || null;
  const username = accountData?.username || null;
  const isLoggedIn = !!address;

  // Actions
  const login = useCallback((data: SmartAccount) => {
    setAccountData(data);
  }, []);

  const logout = useCallback(() => {
    setAccountData(null);
  }, []);

  return {
    address,
    passkey,
    privateKey,
    accountType,
    username,
    isLoggedIn,
    isInitialized,
    login,
    logout,
  };
};

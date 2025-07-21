'use client';
import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi';
import { AuthState } from '@/types/auth';
import { useAccountCreate } from './useAccountCreate';
import { useAuthResponse } from './useAuthResponse';
import { useMessageHandler } from './useMessageHandler';

export const useWalletConnection = (setState?: (state: AuthState) => void) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error, isPending, isSuccess } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const { createAccount, success: accountCreated } = useAccountCreate();
  const { handleAuthSuccessResponse } = useAuthResponse();
  const { incomingRequest, sessionPreferences } = useMessageHandler();

  const connectWallet = async (connectorName: string) => {
    try {
      if (!isConnected) {
        const connector = connectors.find((c) => c.name === connectorName);
        if (connector) {
          connect({ connector });
        }
      } else {
        handleAuthSuccessResponse(
          { address: address! },
          incomingRequest!,
          sessionPreferences,
        );
        setState?.(AuthState.AUTHENTICATED);
      }
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
    }
  };

  const handleCreateAccount = async () => {
    if (isSuccess && walletClient && address) {
      await createAccount('eoa', address);
    }
  };

  useEffect(() => {
    handleCreateAccount();
  }, [isSuccess, walletClient, address]);

  useEffect(() => {
    if (accountCreated && address) {
      handleAuthSuccessResponse(
        { address: address },
        incomingRequest!,
        sessionPreferences,
      );
      setState?.(AuthState.AUTHENTICATED);
    }
  }, [accountCreated, address]);

  return {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnect,
    error,
    isPending,
    accountCreated,
  };
};

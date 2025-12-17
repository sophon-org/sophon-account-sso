'use client';

import {
  type ChainId,
  grantSessionPermission,
  isOsChainId,
  type SessionAction,
} from '@sophon-labs/account-core';
import { useState } from 'react';
import type { Address } from 'viem';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { useCurrentClient } from './useCurrentClient';

export const useSessionPermission = () => {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOsChain = isOsChainId(SOPHON_VIEM_CHAIN.id as ChainId);
  const { getCurrentLocalAccount } = useCurrentClient();

  const approveSessionPermission = async (
    signer: Address,
    actions: SessionAction[],
  ) => {
    try {
      setIsApproving(true);

      if (!isOsChain) {
        throw new Error('Session permission is only supported on OS chains');
      }

      const localAccount = await getCurrentLocalAccount();
      if (!localAccount) {
        throw new Error('No local account available');
      }

      const signature = await grantSessionPermission(
        SOPHON_VIEM_CHAIN.id as ChainId,
        localAccount,
        signer,
        actions,
        process.env.NEXT_PUBLIC_SPONSORSHIP_API_KEY as string,
      );

      if (!signature) {
        throw new Error('Failed to approve session permission');
      }

      return signature;
    } catch (error) {
      console.error('Session Permission Error:', error);
      setError(
        error instanceof Error ? error.message : 'Session Permission Error',
      );
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  return {
    approveSessionPermission,
    isApproving,
    error,
  };
};

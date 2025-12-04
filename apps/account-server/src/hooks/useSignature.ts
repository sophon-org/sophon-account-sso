'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { type ChainId, isOsChainId } from '@sophon-labs/account-core';
import { useMemo, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
import type {
  MessageSigningRequest,
  TypedDataSigningRequest,
} from '@/types/auth';
import { createOsChainSigner } from './signature/osChainSigner';
import { createZksyncSigner } from './signature/zksyncSigner';
import { useAccountContext } from './useAccountContext';

// TODO: remove this in the future, no need for extra calls on RPC
const VERIFY_SIGNATURE = false;

export const useSignature = () => {
  const { account } = useAccountContext();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();
  const isOsChain = isOsChainId(SOPHON_VIEM_CHAIN.id as ChainId);
  const isEOAAccount = !account?.owner.passkey;

  const signer = useMemo(
    () =>
      isOsChain
        ? createOsChainSigner({
            account,
            connectedAddress,
            walletClient,
            primaryWallet: primaryWallet ?? undefined,
            isEOAAccount,
            verifySignature: VERIFY_SIGNATURE,
          })
        : createZksyncSigner({
            account,
            connectedAddress,
            walletClient,
            primaryWallet: primaryWallet ?? undefined,
            isEOAAccount,
            verifySignature: VERIFY_SIGNATURE,
          }),
    [
      account,
      connectedAddress,
      isEOAAccount,
      isOsChain,
      primaryWallet,
      walletClient,
    ],
  );

  const signTypedData = async (payload: TypedDataSigningRequest) => {
    try {
      setIsSigning(true);

      const availableAddress = account?.address || primaryWallet?.address;
      if (!availableAddress) {
        throw new Error('No account address available');
      }

      const signature = await signer.signTypedData(payload);

      if (!signature) {
        throw new Error('Failed to sign typed data');
      }

      return signature;
    } catch (error) {
      console.error('Signing error:', error);
      setError(error instanceof Error ? error.message : 'Signing error');
      throw error;
    } finally {
      setIsSigning(false);
    }
  };

  const signMessage = async (payload: MessageSigningRequest) => {
    try {
      setIsSigning(true);

      const availableAddress = account?.address || primaryWallet?.address;
      if (!availableAddress) {
        throw new Error('No account address available');
      }

      const signature = await signer.signMessage(payload);

      return signature;
    } catch (error) {
      console.error('Signing error:', error);
      setError(error instanceof Error ? error.message : 'Signing error');
      throw error;
    } finally {
      setIsSigning(false);
    }
  };

  return {
    signTypedData,
    signMessage,
    isSigning,
    signingError: error,
  };
};

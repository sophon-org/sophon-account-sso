'use client';

import { useState } from 'react';
import { toAccount } from 'viem/accounts';
import { http, useAccount, useWalletClient } from 'wagmi';
import { createZksyncEcdsaClient } from 'zksync-sso/client/ecdsa';
import { createZksyncPasskeyClient } from 'zksync-sso/client/passkey';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import type {
  MessageSigningRequest,
  TypedDataSigningRequest,
} from '@/types/auth';
import { useAccountContext } from './useAccountContext';

export const useSignature = () => {
  const { account } = useAccountContext();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  const signTypeData = async (payload: TypedDataSigningRequest) => {
    try {
      setIsSigning(true);

      const availableAddress = account?.address;
      if (!availableAddress) {
        throw new Error('No account address available');
      }

      const isEOAAccount = !account?.owner.passkey;
      let signature: string;
      if (isEOAAccount) {
        if (!connectedAddress) {
          throw new Error('Wallet not connected for EOA signing!');
        }

        const localAccount = toAccount({
          address: connectedAddress,
          async signMessage({ message }) {
            const signature = await walletClient?.signMessage({
              message,
            });
            if (!signature) throw new Error('Failed to sign message');
            return signature;
          },
          async signTransaction(transaction) {
            const signature = await walletClient?.signTransaction(
              // @ts-expect-error - Type mismatch between viem account interface and wallet client
              transaction,
            );
            if (!signature) throw new Error('Failed to sign transaction');
            return signature;
          },
          async signTypedData(typedData) {
            const signature = await walletClient?.signTypedData(
              // @ts-expect-error - Type mismatch between viem account interface and wallet client
              typedData,
            );
            if (!signature) throw new Error('Failed to sign typed data');
            return signature;
          },
        });

        const client = await createZksyncEcdsaClient({
          address: account!.address,
          owner: localAccount,
          chain: SOPHON_VIEM_CHAIN,
          transport: http(),
          contracts: {
            session: CONTRACTS.session,
          },
        });

        signature = await client.signTypedData({
          domain: payload.domain,
          types: payload.types,
          primaryType: payload.primaryType,
          message: payload.message,
        });
      } else {
        if (!account.owner.passkey) {
          throw new Error('No passkey data available for signing');
        }

        const client = createZksyncPasskeyClient({
          address: account.address,
          credentialPublicKey: account.owner.passkey,
          userName: account.username || 'Sophon User',
          userDisplayName: account.username || 'Sophon User',
          contracts: CONTRACTS,
          chain: SOPHON_VIEM_CHAIN,
          transport: http(),
        });

        console.log('passkey signature');
        signature = await client.signTypedData({
          domain: payload.domain,
          types: payload.types,
          primaryType: payload.primaryType,
          message: payload.message,
        });
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

      const availableAddress = account?.address;
      if (!availableAddress) {
        throw new Error('No account address available');
      }

      const isEOAAccount = !account?.owner.passkey;

      let signature: string;

      if (isEOAAccount) {
        if (!connectedAddress) {
          throw new Error('Wallet not connected for EOA signing!');
        }

        const localAccount = toAccount({
          address: connectedAddress,
          async signMessage({ message }) {
            const signature = await walletClient?.signMessage({
              message,
            });
            if (!signature) throw new Error('Failed to sign message');
            return signature;
          },
          async signTransaction(transaction) {
            const signature = await walletClient?.signTransaction(
              // @ts-expect-error - Type mismatch between viem account interface and wallet client
              transaction,
            );
            if (!signature) throw new Error('Failed to sign transaction');
            return signature;
          },
          async signTypedData(typedData) {
            const signature = await walletClient?.signTypedData(
              // @ts-expect-error - Type mismatch between viem account interface and wallet client
              typedData,
            );
            if (!signature) throw new Error('Failed to sign typed data');
            return signature;
          },
        });

        const client = await createZksyncEcdsaClient({
          address: account!.address,
          owner: localAccount,
          chain: SOPHON_VIEM_CHAIN,
          transport: http(),
          contracts: {
            session: CONTRACTS.session,
          },
        });

        signature = await client.signMessage({ message: payload.message });
      } else {
        if (!account.owner.passkey) {
          throw new Error('No passkey data available for signing');
        }

        const client = createZksyncPasskeyClient({
          address: account.address,
          credentialPublicKey: account.owner.passkey,
          userName: account.username || 'Sophon User',
          userDisplayName: account.username || 'Sophon User',
          contracts: CONTRACTS,
          chain: SOPHON_VIEM_CHAIN,
          transport: http(),
        });

        console.log('passkey signature');
        signature = await client.signMessage({ message: payload.message });
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

  return {
    signTypeData,
    signMessage,
    isSigning,
    signingError: error,
  };
};

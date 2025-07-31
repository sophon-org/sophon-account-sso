'use client';

import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState } from 'react';
import { toAccount } from 'viem/accounts';
import { http, useAccount, useWalletClient } from 'wagmi';
import { createZksyncEcdsaClient } from 'zksync-sso/client/ecdsa';
import { createZksyncPasskeyClient } from 'zksync-sso/client/passkey';
import { CONTRACTS, VIEM_CHAIN } from '@/lib/constants';
import { verifyEIP1271Signature } from '@/lib/smart-contract';
import type { SigningRequest } from '@/types/auth';
import { useAccountContext } from './useAccountContext';

export const useSignature = () => {
  const { account } = useAccountContext();
  const [isSigning, setIsSigning] = useState(false);
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();

  const sign = async (payload: SigningRequest) => {
    try {
      setIsSigning(true);

      const availableAddress = account?.address || primaryWallet?.address;
      if (!availableAddress) {
        throw new Error('No account address available');
      }

      const isEOAAccount = !account?.owner.passkey;

      let signature: string;

      if (primaryWallet && isEthereumWallet(primaryWallet)) {
        try {
          const client = await primaryWallet.getWalletClient();
          signature = await client.signTypedData({
            domain: payload.domain,
            types: payload.types,
            primaryType: payload.primaryType,
            message: payload.message,
          });
        } catch (error) {
          console.error('Signing error:', error);
          throw error;
        }
      } else if (isEOAAccount) {
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
          chain: VIEM_CHAIN,
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

        await verifyEIP1271Signature({
          accountAddress: payload.address,
          signature,
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
          contracts: {
            accountFactory: CONTRACTS.accountFactory,
            passkey: CONTRACTS.passkey,
            session: CONTRACTS.session,
            recovery: CONTRACTS.recovery,
          },
          chain: VIEM_CHAIN,
          transport: http(),
        });

        signature = await client.signTypedData({
          domain: payload.domain,
          types: payload.types,
          primaryType: payload.primaryType,
          message: payload.message,
        });

        await verifyEIP1271Signature({
          accountAddress: payload.address,
          signature,
          domain: payload.domain,
          types: payload.types,
          primaryType: payload.primaryType,
          message: payload.message,
        });
      }

      return signature;
    } finally {
      setIsSigning(false);
    }
  };

  return {
    sign,
    isSigning,
  };
};

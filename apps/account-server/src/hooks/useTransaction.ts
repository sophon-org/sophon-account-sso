import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState } from 'react';
import { http } from 'viem';
import { toAccount } from 'viem/accounts';
import { useAccount, useWalletClient } from 'wagmi';
import { createZksyncEcdsaClient } from 'zksync-sso/client/ecdsa';
import { createZksyncPasskeyClient } from 'zksync-sso/client/passkey';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { trackTransactionResult } from '@/lib/analytics';
import { CONTRACTS, VIEM_CHAIN } from '@/lib/constants';
import { windowService } from '@/service/window.service';
import type { IncomingRequest, TransactionRequest } from '@/types/auth';

export function useTransaction() {
  const { account } = useAccountContext();
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actorRef = MainStateMachineContext.useActorRef();

  const sendTransaction = async (
    transactionRequest: TransactionRequest,
    incomingRequest: IncomingRequest,
  ) => {
    setIsSending(true);
    const availableAddress = account?.address || primaryWallet?.address;
    if (!availableAddress) {
      throw new Error('No account address available');
    }
    try {
      const isEOAAccount = !account?.owner.passkey;
      let txHash: string = '';
      if (primaryWallet && isEthereumWallet(primaryWallet)) {
        try {
          const client = await primaryWallet.getWalletClient();

          const localAccount = toAccount({
            address: primaryWallet.address as `0x${string}`,
            async signMessage({ message }) {
              const signature = await client?.signMessage({
                message,
              });
              if (!signature) throw new Error('Failed to sign message');
              return signature; // Now guaranteed to be Hex
            },
            async signTransaction(transaction) {
              const signature = await client?.signTransaction(
                // @ts-expect-error - Type mismatch between viem account interface and wallet client
                transaction,
              );
              if (!signature) throw new Error('Failed to sign transaction');
              return signature;
            },
            async signTypedData(typedData) {
              const signature = await client?.signTypedData(
                // @ts-expect-error - Type mismatch between viem account interface and wallet client
                typedData,
              );
              if (!signature) throw new Error('Failed to sign typed data');
              return signature;
            },
          });

          const ecdsaClient = await createZksyncEcdsaClient({
            address: account?.address as `0x${string}`,
            owner: localAccount,
            chain: VIEM_CHAIN,
            transport: http(),
            contracts: {
              session: CONTRACTS.session,
            },
          });

          txHash = await ecdsaClient.sendTransaction({
            to: transactionRequest.to as `0x${string}`,
            value: BigInt(transactionRequest.value || '0'),
            data: (transactionRequest.data as `0x${string}`) || '0x',
            paymaster:
              transactionRequest.paymaster !== undefined &&
              transactionRequest.paymaster !== '0x'
                ? (transactionRequest.paymaster as `0x${string}`)
                : undefined,
            paymasterInput:
              transactionRequest.paymasterInput !== undefined &&
              transactionRequest.paymasterInput !== '0x'
                ? (transactionRequest.paymasterInput as `0x${string}`)
                : undefined,
          });
        } catch (error) {
          console.error('Transaction error:', error);
          throw error;
        }
      } else if (isEOAAccount) {
        console.log('Sending transaction with EOA...');
        const localAccount = toAccount({
          address: connectedAddress as `0x${string}`,
          async signMessage({ message }) {
            const signature = await walletClient?.signMessage({
              message,
            });
            if (!signature) throw new Error('Failed to sign message');
            return signature; // Now guaranteed to be Hex
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
          address: account?.address as `0x${string}`,
          owner: localAccount,
          chain: VIEM_CHAIN,
          transport: http(),
          contracts: {
            session: CONTRACTS.session,
          },
        });

        try {
          const gasEstimate = await client.estimateGas({
            to: transactionRequest.to as `0x${string}`,
            value: BigInt(transactionRequest.value || '0'),
            data: (transactionRequest.data as `0x${string}`) || '0x',
          });
          console.log('Gas estimate:', gasEstimate.toString());
        } catch (gasError) {
          console.error('Gas estimation failed:', gasError);
        }

        let paymasterInput: `0x${string}` | undefined;
        if (transactionRequest.paymasterInput) {
          if (Array.isArray(transactionRequest.paymasterInput)) {
            const hexString =
              '0x' +
              transactionRequest.paymasterInput
                .map((n) => n.toString(16).padStart(2, '0'))
                .join('');
            paymasterInput = hexString as `0x${string}`;
          } else {
            paymasterInput = transactionRequest.paymasterInput as `0x${string}`;
          }
        }

        const txData = {
          to: transactionRequest.to as `0x${string}`,
          value: BigInt(transactionRequest.value || '0'),
          data: (transactionRequest.data as `0x${string}`) || '0x',
          paymaster:
            transactionRequest.paymaster !== undefined &&
            transactionRequest.paymaster !== '0x'
              ? (transactionRequest.paymaster as `0x${string}`)
              : undefined,
          paymasterInput,
        };

        txHash = await client.sendTransaction(txData);
      } else {
        console.log('Sending transaction with Passkey...');
        if (!account.owner.passkey) {
          throw new Error('No passkey data available');
        }

        const client = createZksyncPasskeyClient({
          address: account.address,
          credentialPublicKey: account.owner.passkey,
          userName: account.username || 'Sophon User',
          userDisplayName: account.username || 'Sophon User',
          contracts: CONTRACTS,
          chain: VIEM_CHAIN,
          transport: http(),
        });

        try {
          const gasEstimate = await client.estimateGas({
            to: transactionRequest.to as `0x${string}`,
            value: BigInt(transactionRequest.value || '0'),
            data: (transactionRequest.data as `0x${string}`) || '0x',
          });
          console.log('Gas estimate:', gasEstimate.toString());
        } catch (gasError) {
          console.error('Gas estimation failed:', gasError);
        }

        txHash = await client.sendTransaction({
          to: transactionRequest.to as `0x${string}`,
          value: BigInt(transactionRequest.value || '0'),
          data: (transactionRequest.data as `0x${string}`) || '0x',
          paymaster:
            transactionRequest.paymaster !== undefined &&
            transactionRequest.paymaster !== '0x'
              ? (transactionRequest.paymaster as `0x${string}`)
              : undefined,
          paymasterInput:
            transactionRequest.paymasterInput !== undefined &&
            transactionRequest.paymasterInput !== '0x'
              ? (transactionRequest.paymasterInput as `0x${string}`)
              : undefined,
        });
      }

      trackTransactionResult(true, txHash);

      if (windowService.isManaged() && incomingRequest) {
        const txResponse = {
          id: crypto.randomUUID(),
          requestId: incomingRequest.id,
          content: {
            result: txHash,
          },
        };

        windowService.sendMessage(txResponse);
        actorRef.send({ type: 'ACCEPT' });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setError(error instanceof Error ? error.message : 'Transaction failed');
      // Track failed transaction
      const errorMessage =
        error instanceof Error ? error.message : 'Transaction failed';
      trackTransactionResult(false, undefined, errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    sendTransaction,
    transactionError: error,
  };
}

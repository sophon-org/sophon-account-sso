import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback, useState } from 'react';
import { http } from 'viem';
import { toAccount } from 'viem/accounts';
import { useAccount, useWalletClient } from 'wagmi';
import { createZksyncEcdsaClient } from 'zksync-sso/client/ecdsa';
import { createZksyncPasskeyClient } from 'zksync-sso/client/passkey';
import { useAccountContext } from '@/hooks/useAccountContext';
import { CONTRACTS, VIEM_CHAIN } from '@/lib/constants';

export function useEstimateFee() {
  const { account } = useAccountContext();
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();
  const [isEstimating, setIsEstimating] = useState(false);

  // TODO Add transactionRequest as a parameter here once we need to estimate fee for a specific transaction
  const estimateFee = useCallback(async () => {
    setIsEstimating(true);
    const availableAddress = account?.address || primaryWallet?.address;
    if (!availableAddress) {
      throw new Error('No account address available');
    }
    try {
      const isEOAAccount = !account?.owner.passkey;
      let gasPrice: bigint = BigInt(0);
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
          gasPrice = await ecdsaClient.getGasPrice();
        } catch (error) {
          console.error('Transaction error:', error);
          throw error;
        }
      } else if (isEOAAccount) {
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

        gasPrice = await client.getGasPrice();
      } else {
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

        gasPrice = await client.getGasPrice();
      }

      const gasLimit = BigInt(21000);

      return gasPrice * gasLimit;
    } catch (error) {
      console.error('Estimate fee failed:', error);
    } finally {
      setIsEstimating(false);
    }
  }, [account, connectedAddress, walletClient, primaryWallet]);

  return {
    isEstimating,
    estimateFee,
  };
}

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { useAccountContext } from '@/hooks/useAccountContext';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { AccountType, type PasskeySigner } from '@/types/smart-account';
import { isEOABasedAccount } from './useUserIdentification';
interface EstimateFeeParams {
  to: string;
  data?: string;
  value?: string;
}

export function useEstimateFee() {
  const { account } = useAccountContext();
  const { primaryWallet } = useDynamicContext();
  const [isEstimating, setIsEstimating] = useState(false);

  const estimateFee = useCallback(
    async (transactionParams?: EstimateFeeParams) => {
      setIsEstimating(true);
      const availableAddress = account?.address || primaryWallet?.address;
      if (!availableAddress) {
        throw new Error('No account address available');
      }
      try {
        const publicClient = createPublicClient({
          chain: VIEM_CHAIN,
          transport: http(),
        });

        const gasPrice = await publicClient.getGasPrice();

        if (!transactionParams) {
          throw new Error('Transaction params are required');
        }

        const estimateParams = {
          account: availableAddress as `0x${string}`,
          to: transactionParams.to as `0x${string}`,
          data: transactionParams.data as `0x${string}` | undefined,
          value: transactionParams.value
            ? BigInt(transactionParams.value)
            : undefined,
        };

        const gasLimit = await publicClient.estimateGas(estimateParams);

        return gasPrice * gasLimit;
      } catch (error) {
        console.error('Estimate fee failed:', error);
      } finally {
        setIsEstimating(false);
      }
    },
    [account, primaryWallet],
  );

  return {
    isEstimating,
    estimateFee,
  };
}

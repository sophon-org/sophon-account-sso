import { useEstimateGas, useGasPrice } from 'wagmi';
import type { UseGasEstimationArgs } from '../types/swap';

/**
 * Hook to estimate gas for a transaction
 * Provides gas estimate, gas price, and total fee estimation
 */
export function useGasEstimation(
  args: UseGasEstimationArgs & { enabled?: boolean },
) {
  const { to, from, data, value, chainId, enabled = true } = args;

  // Estimate gas units needed (use context automatically)
  const {
    data: gasEstimate,
    isLoading: isEstimatingGas,
    error: gasEstimateError,
    refetch: refetchGasEstimate,
  } = useEstimateGas({
    account: from,
    to,
    data: data as `0x${string}` | undefined,
    value: value as bigint | undefined,
    chainId,
    query: {
      enabled: enabled && !!to && !!data,
    },
  });

  // Get current gas price (legacy, use context automatically)
  const {
    data: gasPrice,
    isLoading: isLoadingGasPrice,
    error: gasPriceError,
  } = useGasPrice({
    chainId,
    query: {
      enabled: true,
    },
  });

  // Calculate total fee estimates
  const totalFeeEstimate =
    gasEstimate && gasPrice ? gasEstimate * gasPrice : undefined;

  const refetch = async () => {
    return await refetchGasEstimate();
  };

  return {
    gasEstimate,
    gasPrice,
    totalFeeEstimate,
    isLoading: isEstimatingGas || isLoadingGasPrice,
    error: gasEstimateError || gasPriceError,
    refetch,
  };
}

/**
 * Helper hook to estimate gas for a swap transaction
 */
export function useSwapGasEstimation(
  transactionData?: {
    to: `0x${string}`;
    data: string;
    value: string;
  },
  chainId?: number,
) {
  return useGasEstimation({
    to: transactionData?.to,
    data: transactionData?.data,
    value: transactionData?.value ? BigInt(transactionData.value) : undefined,
    chainId: chainId || 1,
  });
}

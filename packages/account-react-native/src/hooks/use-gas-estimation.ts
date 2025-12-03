import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPublicClient, http } from 'viem';
import type { UseGasEstimationArgs } from '../types';
import { useSophonContext } from './use-sophon-context';

/**
 * Hook to estimate gas for a transaction
 * Provides gas estimate, gas price, and total fee estimation
 */
export function useGasEstimation(
  args: UseGasEstimationArgs & { enabled?: boolean },
) {
  const { to, from, data, value, enabled = true } = args;
  const [gasEstimate, setGasEstimate] = useState<bigint | undefined>(undefined);
  const [gasPrice, setGasPrice] = useState<bigint | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { chain, account } = useSophonContext();

  // Create a public client for gas estimation (memoized to prevent re-creation)
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain,
        transport: http(),
      }),
    [chain],
  );

  // Function to estimate gas
  const estimateGas = useCallback(async () => {
    if (!to || !data) {
      setGasEstimate(undefined);
      return;
    }

    try {
      const estimate = await publicClient.estimateGas({
        account: (from || account?.address) as `0x${string}` | undefined,
        to: to as `0x${string}`,
        data: data as `0x${string}`,
        value: value,
      });

      setGasEstimate(estimate);
      return estimate;
    } catch (err) {
      console.error('Failed to estimate gas:', err);
      setError(err instanceof Error ? err : new Error('Gas estimation failed'));
      setGasEstimate(undefined);
      return undefined;
    }
  }, [to, from, data, value, publicClient, account?.address]);

  // Function to get gas price
  const getGasPrice = useCallback(async () => {
    try {
      const price = await publicClient.getGasPrice();
      setGasPrice(price);
      return price;
    } catch (err) {
      console.error('Failed to get gas price:', err);
      setError(
        err instanceof Error ? err : new Error('Gas price fetch failed'),
      );
      setGasPrice(undefined);
      return undefined;
    }
  }, [publicClient]);

  // Function to refetch both gas estimate and gas price
  const refetch = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([estimateGas(), getGasPrice()]);
    } catch (err) {
      console.error('Failed to refetch gas data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, estimateGas, getGasPrice]);

  // Load gas data on mount and when dependencies change
  useEffect(() => {
    if (enabled && to && data) {
      setIsLoading(true);
      setError(null);

      Promise.all([estimateGas(), getGasPrice()])
        .catch((err) => {
          console.error('Failed to load gas data:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [enabled, to, data, estimateGas, getGasPrice]);

  const estimateFee = useCallback(async () => {
    try {
      const [price, gasLimit] = await Promise.all([
        getGasPrice(),
        estimateGas(),
      ]);
      const value = gasLimit && price ? gasLimit * price : undefined;
      return value;
    } catch {
      return undefined;
    }
  }, [estimateGas, getGasPrice]);

  // Calculate total fee estimates
  const totalFeeEstimate =
    gasEstimate && gasPrice ? gasEstimate * gasPrice : undefined;

  return {
    gasEstimate,
    gasPrice,
    totalFeeEstimate,
    isLoading,
    isError: !!error,
    error,
    refetch,
    estimateGas,
    estimateFee,
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

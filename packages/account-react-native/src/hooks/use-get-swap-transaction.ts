import { SwapAPIURL } from '@sophon-labs/account-core';
import { useEffect, useMemo, useState } from 'react';
import type {
  SwapApiConfig,
  UnifiedTransactionResponse,
  UseGetSwapTransactionArgs,
} from '../types';
import { createApiClient } from '../utils/api-client';
import { useSophonContext } from './use-sophon-context';

/**
 * Hook to prepare a swap transaction
 * Calls /swap/transaction endpoint and returns transaction data ready to send
 */
export function useGetSwapTransaction(
  args: UseGetSwapTransactionArgs,
  apiConfig: SwapApiConfig,
) {
  const { config, enabled = false } = args; // Default to false
  const [data, setData] = useState<UnifiedTransactionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const apiClient = useMemo(() => createApiClient(apiConfig), [apiConfig]);

  const fetchData = useMemo(
    () => async () => {
      if (!config.sender) {
        setError(new Error('No sender address'));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = {
          actionType: config.actionType,
          sender: config.sender,
          sourceChain: config.sourceChain,
          destinationChain: config.destinationChain,
          sourceToken: config.sourceToken,
          destinationToken: config.destinationToken,
          amount: config.amount.toString(),
          slippage: config.slippage,
          ...(config.recipient && { recipient: config.recipient }),
        };

        const result = await apiClient.get<UnifiedTransactionResponse>(
          '/swap/transaction',
          params,
        );
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [config, apiClient],
  );

  // Fetch data when enabled and sender is available
  useEffect(() => {
    if (enabled && config.sender) {
      fetchData();
    }
  }, [enabled, config.sender, fetchData]);

  return { data, isLoading, isError: !!error, error, refetch: fetchData };
}

/**
 * Default configuration for common usage
 */
export function useGetSwapTransactionWithDefaults(
  args: UseGetSwapTransactionArgs,
  baseUrl?: string,
) {
  const { network } = useSophonContext();
  const defaultBaseUrl = SwapAPIURL[network];
  return useGetSwapTransaction(args, { baseUrl: baseUrl ?? defaultBaseUrl });
}

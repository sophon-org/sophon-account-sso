import { useState, useEffect, useMemo } from 'react';
import type { 
  UseGetSwapTransactionArgs, 
  UnifiedTransactionResponse, 
  SwapApiConfig 
} from '../types/swap';
import { createApiClient } from '../utils/apiClient';

/**
 * Hook to prepare a swap transaction
 * Calls /swap/transaction endpoint and returns transaction data ready to send
 */
export function useGetSwapTransaction(
  args: UseGetSwapTransactionArgs,
  apiConfig: SwapApiConfig
) {
  const { config, enabled = false } = args; // Default to false
  const [data, setData] = useState<UnifiedTransactionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const apiClient = useMemo(() => createApiClient(apiConfig), [apiConfig.baseUrl]);

  const fetchData = useMemo(() => async () => {
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

      const result = await apiClient.get<UnifiedTransactionResponse>('/swap/transaction', params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [config, apiClient]);

  // Fetch data when enabled and sender is available
  useEffect(() => {
    if (enabled && config.sender) {
      fetchData();
    }
  }, [enabled, config.sender, fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Default configuration for common usage
 */
export function useGetSwapTransactionWithDefaults(
  args: UseGetSwapTransactionArgs,
  baseUrl = 'http://localhost:4001'
) {
  return useGetSwapTransaction(args, { baseUrl });
}
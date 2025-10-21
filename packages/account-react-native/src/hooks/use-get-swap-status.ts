import { SwapAPIURL } from '@sophon-labs/account-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  SwapApiConfig,
  UnifiedStatusResponse,
  UseGetSwapStatusArgs,
} from '../types';
import { createApiClient } from '../utils/api-client';
import { useSophonContext } from './use-sophon-context';

/**
 * Hook to track a transaction's lifecycle
 *
 * Calls /swap/status endpoint with optional polling
 */
export function useGetSwapStatus(
  args: UseGetSwapStatusArgs,
  apiConfig: SwapApiConfig,
) {
  const { txHash, chainId, enabled = false, refetchInterval = 0 } = args;
  const [data, setData] = useState<UnifiedStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const apiClient = useMemo(() => createApiClient(apiConfig), [apiConfig]);

  useEffect(() => {
    // Reset states when conditions change
    if (!enabled || !txHash) {
      setIsLoading(false);
      setError(null);
      // Keep existing data when disabled
      return;
    }

    let intervalId: NodeJS.Timeout;
    let isCancelled = false;

    const fetchData = async () => {
      if (isCancelled) return;

      setIsLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = {
          txHash,
        };

        if (chainId) {
          params.sourceChainId = chainId.toString();
        }

        const result = await apiClient.get<UnifiedStatusResponse>(
          '/swap/status',
          params,
        );

        if (!isCancelled) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling if refetchInterval is provided
    if (refetchInterval > 0) {
      intervalId = setInterval(fetchData, refetchInterval);
    }

    return () => {
      isCancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, txHash, chainId, refetchInterval, apiClient]);

  const refetch = useCallback(async () => {
    if (!txHash) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = { txHash };
      if (chainId) {
        params.sourceChainId = chainId.toString();
      }

      const result = await apiClient.get<UnifiedStatusResponse>(
        '/swap/status',
        params,
      );
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [txHash, chainId, apiClient]);

  return { data, isLoading, isError: !!error, error, refetch };
}

/**
 * Default configuration for common usage
 */
export function useGetSwapStatusWithDefaults(
  args: UseGetSwapStatusArgs,
  baseUrl?: string,
) {
  const { chainId } = useSophonContext();
  const defaultBaseUrl = SwapAPIURL[chainId];
  return useGetSwapStatus(args, { baseUrl: baseUrl ?? defaultBaseUrl });
}

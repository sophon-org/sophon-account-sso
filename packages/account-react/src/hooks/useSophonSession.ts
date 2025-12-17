import type {
  SessionAction,
  SessionPermissionResponse,
} from '@sophon-labs/account-core';
import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import { useSophonContext } from './useSophonContext';

export const useSophonSession = () => {
  const { walletClient } = useSophonContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSessionPermission = useCallback(
    async (
      signer: Address,
      actions: SessionAction[],
    ): Promise<SessionPermissionResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        return await walletClient.requestSessionPermission(signer, actions);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to request session permission';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient],
  );

  return {
    requestSessionPermission,
    isLoading,
    error,
  };
};

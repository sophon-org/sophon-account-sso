import type { ConsentResponse } from '@sophon-labs/account-core';
import { useCallback, useState } from 'react';
import { hasRequiredConsents } from '../utils/consent';
import { useSophonContext } from './useSophonContext';

export const useSophonConsent = () => {
  const { walletClient, accessToken } = useSophonContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestConsent = useCallback(async (): Promise<ConsentResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user already has required consents in their JWT
      if (hasRequiredConsents(accessToken?.value)) {
        // User already consented, return success immediately
        return {
          consentAds: true,
          consentData: true,
        };
      }

      // No consent found in JWT, open popup to request consent
      return await walletClient.requestConsent();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to request consent';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, accessToken]);

  return {
    requestConsent,
    isLoading,
    error,
  };
};

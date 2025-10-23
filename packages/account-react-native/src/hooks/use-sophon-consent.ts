import { useCallback, useState } from 'react';
import type { ConsentResponse } from '../types/consent';
import { hasRequiredConsents } from '../utils/consent';
import { useSophonContext } from './use-sophon-context';

export const useSophonConsent = (force: boolean = false) => {
  const { walletClient, accessToken } = useSophonContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestConsent = useCallback(async (): Promise<ConsentResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user already has required consents in their JWT
      if (!force && hasRequiredConsents(accessToken?.value)) {
        // User already consented, return success immediately
        return {
          consentAds: true,
          consentData: true,
        };
      }

      return await walletClient!.requestConsent();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to request consent';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, accessToken, force]);

  return {
    requestConsent,
    isLoading,
    error,
  };
};

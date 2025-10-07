import { useCallback, useState } from 'react';
import type { ConsentResponse } from '../types/consent';
import { hasRequiredConsents } from '../utils/consent';
import { useSophonContext } from './useSophonContext';

export const useSophonConsent = () => {
  const { communicator, accessToken } = useSophonContext();
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
          id: crypto.randomUUID(),
          content: {
            result: {
              consentAds: true,
              consentData: true,
            },
          },
        };
      }

      // No consent found in JWT, open popup to request consent
      const request = {
        id: crypto.randomUUID(),
        content: {
          action: {
            method: 'sophon_requestConsent',
            params: [],
          },
        },
      };

      const response =
        await communicator.postRequestAndWaitForResponse(request);
      const consentResponse = response as ConsentResponse;

      // Check if the response contains an error
      if (consentResponse.content.error) {
        setError(consentResponse.content.error.message);
      }

      return consentResponse;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to request consent';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [communicator, accessToken]);

  return {
    requestConsent,
    isLoading,
    error,
  };
};

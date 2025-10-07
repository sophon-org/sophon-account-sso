import { useState } from 'react';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { env } from '@/env';
import { trackConsentContinue, trackConsentDismissed } from '@/lib/analytics';
import { windowService } from '@/service/window.service';

export const SOPHON_ACCESS_TOKEN_KEY = 'SOPHON_ACCESS_TOKEN';
export const SOPHON_REFRESH_TOKEN_KEY = 'SOPHON_REFRESH_TOKEN';

export function useConsentAuthorization() {
  const { incoming } = MainStateMachineContext.useSelector(
    (state) => state.context.requests,
  );
  const actorRef = MainStateMachineContext.useActorRef();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get access token from localStorage
  const getAccessToken = (): string | null => {
    return localStorage.getItem(SOPHON_ACCESS_TOKEN_KEY);
  };

  // Get refresh token from localStorage
  const getRefreshToken = (): string | null => {
    return localStorage.getItem(SOPHON_REFRESH_TOKEN_KEY);
  };

  // Refresh the access token to get updated consent claims in JWT
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const baseUrl = env.NEXT_PUBLIC_AUTH_SERVER_ENDPOINT;
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        console.error('No refresh token available for refresh');
        return false;
      }

      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return false;
      }

      const result = await response.json();

      // Store new tokens in localStorage and emit them to the parent window
      if (result.accessToken) {
        localStorage.setItem(SOPHON_ACCESS_TOKEN_KEY, result.accessToken);
        windowService.emitAccessToken(
          result.accessToken,
          result.accessTokenExpiresAt,
        );
      }
      if (result.refreshToken) {
        localStorage.setItem(SOPHON_REFRESH_TOKEN_KEY, result.refreshToken);
        windowService.emitRefreshToken(
          result.refreshToken,
          result.refreshTokenExpiresAt,
        );
      }

      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      return false;
    }
  };

  const onRefuseConsent = async (consentData?: {
    consentAds: boolean;
    consentData: boolean;
  }) => {
    if (!incoming) return;

    // Track consent dismissal
    trackConsentDismissed(
      {
        personalization: consentData?.consentData
          ? 'accept'
          : consentData?.consentData === false
            ? 'reject'
            : 'pending',
        ads: consentData?.consentAds
          ? 'accept'
          : consentData?.consentAds === false
            ? 'reject'
            : 'pending',
      },
      'modal_closed',
    );

    const response = {
      id: crypto.randomUUID(),
      requestId: incoming.id,
      content: {
        result: null,
        error: {
          message: 'User refused the consent request.',
          code: -32002,
        },
      },
    };

    windowService.sendMessage(response);
    actorRef.send({ type: 'ACCEPT' });
  };

  const onAcceptConsent = async (consentData: {
    consentAds: boolean;
    consentData: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!incoming) return;

      const baseUrl = env.NEXT_PUBLIC_AUTH_SERVER_ENDPOINT;

      // Build array of consent kinds to save
      const kinds: string[] = [];
      if (consentData.consentAds) {
        kinds.push('PERSONALIZATION_ADS');
      }
      if (consentData.consentData) {
        kinds.push('SHARING_DATA');
      }

      // Save all consents in one request
      if (kinds.length > 0) {
        const accessToken = getAccessToken();
        if (!accessToken) {
          throw new Error('No access token available');
        }

        const consentResponse = await fetch(`${baseUrl}/me/consent/giveMany`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ kinds }),
        });

        if (!consentResponse.ok) {
          const errorText = await consentResponse.text();
          console.error(
            'Consent save failed:',
            consentResponse.status,
            errorText,
          );
          throw new Error(`Failed to save consent: ${consentResponse.status}`);
        }

        // Refresh token to get updated consent claims in JWT
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Failed to refresh token');
        }
      }

      // Track consent continue
      trackConsentContinue(
        {
          personalization: consentData.consentData ? 'accept' : 'reject',
          ads: consentData.consentAds ? 'accept' : 'reject',
        },
        'individual',
      );

      // Send success response to parent window
      const response = {
        id: crypto.randomUUID(),
        requestId: incoming.id,
        content: {
          result: {
            consentAds: consentData.consentAds,
            consentData: consentData.consentData,
          },
        },
      };

      windowService.sendMessage(response);
      actorRef.send({ type: 'ACCEPT' });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Consent processing failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    onRefuseConsent,
    onAcceptConsent,
    isLoading,
    error,
  };
}

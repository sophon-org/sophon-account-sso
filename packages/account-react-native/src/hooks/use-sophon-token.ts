import { AccountAuthAPIURL } from '@sophon-labs/account-core';
import { useCallback, useMemo } from 'react';
import type { SophonJWTToken } from '@/types';
import { useSophonContext } from './use-sophon-context';

const ACCESS_TOKEN_EXPIRATION_THRESHOLD = 1000 * 60 * 5; // 5 mins before

export const useSophonToken = () => {
  const {
    accessToken,
    refreshToken,
    network,
    updateAccessToken,
    updateRefreshToken,
  } = useSophonContext();

  const baseAuthAPIURL = useMemo(() => {
    return AccountAuthAPIURL[network];
  }, [network]);

  const getAccessToken = useCallback(
    async (
      forceRefresh = false,
      baseURL?: string,
    ): Promise<SophonJWTToken | null> => {
      if (!accessToken) {
        console.warn('No access token found to use');
        return null;
      }

      const now = new Date();
      const expiresAt = new Date(accessToken.expiresAt * 1000);
      const isExpired = expiresAt < now;
      const needsRefreshAt = new Date(
        expiresAt.getTime() - ACCESS_TOKEN_EXPIRATION_THRESHOLD,
      );

      // if the token is expired, refresh it
      if (forceRefresh || needsRefreshAt < now) {
        if (!refreshToken?.value) {
          console.warn('No refresh token found to use');
          return null;
        }

        const response = await fetch(
          `${baseURL ?? baseAuthAPIURL}/auth/refresh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${refreshToken.value}`,
            },
          },
        );

        if (!response.ok) {
          // if we got an error, but the token is not expired, then try to reuse the token for now
          if (isExpired) {
            throw new Error(
              `Failed to refresh access token: ${response.statusText}`,
            );
          }
          return accessToken;
        }

        const data = await response.json();

        updateAccessToken({
          value: data.accessToken,
          expiresAt: data.accessTokenExpiresAt,
        });
        updateRefreshToken({
          value: data.refreshToken,
          expiresAt: data.refreshTokenExpiresAt,
        });

        return {
          value: data.accessToken,
          expiresAt: data.accessTokenExpiresAt,
        };
      }

      return accessToken;
    },
    [
      accessToken,
      refreshToken,
      baseAuthAPIURL,
      updateAccessToken,
      updateRefreshToken,
    ],
  );

  const getMe = useCallback(
    async (baseURL?: string) => {
      const token = await getAccessToken(false, baseURL);
      if (!token?.value) {
        console.warn('No access token found to use');
        return null;
      }

      const response = await fetch(`${baseURL ?? baseAuthAPIURL}/auth/me`, {
        headers: {
          authorization: `Bearer ${token.value}`,
        },
      });
      const data = await response.json();
      return data;
    },
    [getAccessToken, baseAuthAPIURL],
  );

  return {
    getAccessToken,
    getMe,
  };
};

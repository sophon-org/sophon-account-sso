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

  const refreshAccessToken = useCallback(
    async (
      forceRefresh = false,
      baseURL: string,
    ): Promise<SophonJWTToken | null> => {
      if (!accessToken) {
        console.warn('No access token found to use');
        return null;
      }

      const accessExpiresAt = new Date(
        accessToken.expiresAt * 1000 - ACCESS_TOKEN_EXPIRATION_THRESHOLD,
      );

      // if the token is expired, refresh it
      if (forceRefresh || accessExpiresAt < new Date()) {
        if (!refreshToken) {
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

  const getAccessToken = useCallback(
    (
      forceRefresh = false,
      baseURL: string,
    ): SophonJWTToken | null | undefined => {
      refreshAccessToken(forceRefresh, baseURL);
      return accessToken;
    },
    [accessToken, refreshAccessToken],
  );

  const getMe = useCallback(
    async (baseURL: string) => {
      if (!accessToken) {
        console.warn('No access token found to use');
        return null;
      }

      const response = await fetch(`${baseURL ?? baseAuthAPIURL}/auth/me`, {
        headers: {
          authorization: `Bearer ${accessToken.value}`,
        },
      });
      const data = await response.json();
      return data;
    },
    [accessToken, baseAuthAPIURL],
  );

  return {
    refreshAccessToken,
    getAccessToken,
    getMe,
  };
};

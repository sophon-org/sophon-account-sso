import { AccountAuthAPIURL } from '@sophon-labs/account-core';
import { useCallback, useMemo } from 'react';
import { useSophonContext } from './useSophonContext';

const ACCESS_TOKEN_EXPIRATION_THRESHOLD = 1000 * 60 * 5; // 5 mins before

/**
 * Hook that handles the authentication token and the logic regarging its refreshing
 */
export const useSophonToken = () => {
  const { token, refreshToken, network, updateToken, updateRefreshToken } =
    useSophonContext();

  const baseAuthAPIURL = useMemo(() => {
    return AccountAuthAPIURL[network];
  }, [network]);

  const getAccessToken = useCallback(
    async (forceRefresh = false, baseURL: string) => {
      const accessExpiresAt = new Date(token.expiresAt * 1000);
      // if the token is expired, refresh it
      if (
        forceRefresh ||
        accessExpiresAt <
          new Date(Date.now() + ACCESS_TOKEN_EXPIRATION_THRESHOLD)
      ) {
        console.log(
          'token is expired, refreshing it',
          accessExpiresAt.toISOString(),
        );
        const response = await fetch(
          `${baseURL ?? baseAuthAPIURL}/auth/refresh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${refreshToken.refreshToken}`,
            },
          },
        );
        const data = await response.json();

        console.log('refreshed token', data);
        updateToken({
          token: data.accessToken,
          expiresAt: data.accessTokenExpiresAt,
        });
        updateRefreshToken({
          refreshToken: data.refreshToken,
          expiresAt: data.refreshTokenExpiresAt,
        });
        return {
          token: data.accessToken,
          expiresAt: data.accessTokenExpiresAt,
        };
      }
      console.log('token is still valid until', accessExpiresAt.toISOString());
      return token;
    },
    [token, refreshToken, baseAuthAPIURL, updateToken, updateRefreshToken],
  );

  const getMe = useCallback(
    async (baseURL: string) => {
      const response = await fetch(`${baseURL ?? baseAuthAPIURL}/auth/me`, {
        headers: {
          authorization: `Bearer ${token.token}`,
        },
      });
      const data = await response.json();
      return data;
    },
    [token, baseAuthAPIURL],
  );

  return {
    token,
    getAccessToken,
    getMe,
  };
};

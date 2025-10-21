import { AccountAuthAPIURL, type ChainId } from '@sophon-labs/account-core';
import { setCookieAuthToken } from '../cookie';
import { SophonAppStorage, StorageKeys } from '../storage/storage';

export const ACCESS_TOKEN_EXPIRATION_THRESHOLD = 1000 * 60 * 5; // 5 mins before

export const getAccessToken = async (
  chainId: ChainId,
  forceRefresh?: boolean,
  baseURL?: string,
) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const accessTokenSerialized = SophonAppStorage.getItem(
    StorageKeys.USER_ACCESS_TOKEN,
  );
  const refreshTokenSerialized = SophonAppStorage.getItem(
    StorageKeys.USER_REFRESH_TOKEN,
  );
  if (!accessTokenSerialized || !refreshTokenSerialized) {
    return null;
  }

  const accessToken = JSON.parse(accessTokenSerialized);
  const refreshToken = JSON.parse(refreshTokenSerialized);

  const accessExpiresAt = new Date(
    accessToken.expiresAt * 1000 - ACCESS_TOKEN_EXPIRATION_THRESHOLD,
  );

  const baseAuthAPIURL = AccountAuthAPIURL[chainId];

  // if the token is expired, refresh it
  if (forceRefresh || accessExpiresAt < new Date()) {
    const response = await fetch(`${baseURL ?? baseAuthAPIURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${refreshToken.value}`,
      },
    });
    const data = await response.json();

    SophonAppStorage.setItem(
      StorageKeys.USER_ACCESS_TOKEN,
      JSON.stringify(data.accessToken),
    );

    setCookieAuthToken(data.accessToken.value);

    SophonAppStorage.setItem(
      StorageKeys.USER_REFRESH_TOKEN,
      JSON.stringify(data.refreshToken),
    );

    return data.accessToken;
  }

  return accessToken;
};

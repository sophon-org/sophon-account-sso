import {
  AccountAuthAPIURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { sendUIMessage } from '../messaging';
import { SophonAppStorage, StorageKeys } from '../provider';

const ACCESS_TOKEN_EXPIRATION_THRESHOLD = 1000 * 60 * 5; // 5 mins before

export const getAccessToken = async (
  network: SophonNetworkType,
  forceRefresh: boolean = false,
) => {
  const accessTokenSerialized = SophonAppStorage.getItem(
    StorageKeys.USER_ACCESS_TOKEN,
  );

  if (!accessTokenSerialized) {
    throw new Error('No access token found');
  }

  const accessToken = JSON.parse(accessTokenSerialized);
  const now = new Date();
  const expiresAt = new Date(accessToken.expiresAt * 1000);
  const isExpired = expiresAt < now;
  const needsRefreshAt = new Date(
    expiresAt.getTime() - ACCESS_TOKEN_EXPIRATION_THRESHOLD,
  );

  console.log('[Sophon Account] Getting access token for network', network);
  console.log('[Sophon Account] Force refresh', forceRefresh);
  console.log(
    '[Sophon Account] Existing token expires at',
    expiresAt.toISOString(),
  );
  console.log(
    '[Sophon Account] Needs refresh at',
    needsRefreshAt.toISOString(),
  );
  console.log('[Sophon Account] Is expired', isExpired);

  // if the token is expired, refresh it
  if (forceRefresh || needsRefreshAt < now) {
    const refreshTokenSerialized = await SophonAppStorage.getItem(
      StorageKeys.USER_REFRESH_TOKEN,
    );

    if (!refreshTokenSerialized) {
      throw new Error('No refresh token found to use');
    }

    const refreshToken = JSON.parse(refreshTokenSerialized);

    console.log(
      '[Sophon Account] Refreshing access token for network',
      network,
      '[Sophon Account] url',
      `${AccountAuthAPIURL[network]}/auth/refresh`,
    );
    const response = await fetch(`${AccountAuthAPIURL[network]}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${refreshToken.value}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to refresh access token: ${response.statusText}: ${errorText}`,
      );
    }

    const data = await response.json();
    console.log(
      '[Sophon Account] Refreshed access tokens for network',
      network,
      'data',
      data,
    );

    sendUIMessage('setAccessToken', {
      value: data.accessToken,
      expiresAt: data.accessTokenExpiresAt,
    });

    sendUIMessage('setRefreshToken', {
      value: data.refreshToken,
      expiresAt: data.refreshTokenExpiresAt,
    });

    return {
      value: data.accessToken,
      expiresAt: data.accessTokenExpiresAt,
    };
  }

  console.log('[Sophon Account] Returning existing token, no need to renewal');
  return accessToken;
};

import {
  AccountAuthAPIURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { getAccessToken } from './access-token';

export const getMe = async (network: SophonNetworkType) => {
  const token = await getAccessToken(network);
  if (!token?.value) {
    throw new Error('No access token found to use');
  }

  const response = await fetch(`${AccountAuthAPIURL[network]}/auth/me`, {
    headers: {
      authorization: `Bearer ${token.value}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info /me: ${response.statusText}`);
  }

  return await response.json();
};

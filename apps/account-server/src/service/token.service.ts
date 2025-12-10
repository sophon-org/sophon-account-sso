import type { ChainId } from '@sophon-labs/account-core';
import type { Address, TypedDataDefinition } from 'viem';
import { env } from '@/env';

export const requestNonce = async (
  chainId: ChainId,
  address: string,
  partnerId: string,
  fields: string[],
  userId?: string,
) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_AUTH_SERVER_ENDPOINT}/auth/nonce`,
    {
      method: 'POST',
      headers: {
        // Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, partnerId, fields, userId, chainId }),
    },
  );

  if (!response.ok) {
    console.error(response.statusText);
    throw new Error('Failed to request authentication nonce');
  }

  const result = await response.json();

  return result.nonce;
};

export const verifyAuthorization = async (
  address: Address,
  typedData: TypedDataDefinition,
  signature: string,
  nonceToken: string,
  rememberMe: boolean,
  ownerAddress?: Address,
  audience?: string,
  contentsHash?: string,
) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_AUTH_SERVER_ENDPOINT}/auth/verify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typedData,
        signature,
        nonceToken,
        rememberMe,
        address,
        ownerAddress,
        audience,
        contentsHash,
      }),
    },
  );

  if (!response.ok) {
    console.error(await response.text());
    throw new Error('Failed to verify authorization');
  }

  const result = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
  };
  return result;
};

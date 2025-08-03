import type { Address, TypedDataDefinition } from 'viem';
import { env } from '@/env';

export const requestNonce = async (address: string) => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_AUTH_SERVER_ENDPOINT}/auth/nonce`,
    {
      method: 'POST',
      headers: {
        // Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
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
) => {
  console.log(
    'requesting',
    `${env.NEXT_PUBLIC_AUTH_SERVER_ENDPOINT}/auth/verify`,
  );
  const response = await fetch(
    `${env.NEXT_PUBLIC_AUTH_SERVER_ENDPOINT}/auth/verify`,
    {
      method: 'POST',
      headers: {
        // Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typedData: JSON.stringify(typedData),
        signature,
        nonceToken,
        rememberMe,
        address,
      }),
    },
  );

  if (!response.ok) {
    console.log(await response.text());
    throw new Error('Failed to verify authorization');
  }

  const result = await response.json();
  return result;
};

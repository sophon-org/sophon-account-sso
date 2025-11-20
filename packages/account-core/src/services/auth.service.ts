import type { Address, TypedDataDefinition } from 'viem';
import { AccountAuthAPIURL, type ChainId } from '../constants';

export const AuthService = {
  getSmartAccount: async (chainId: ChainId, owner: Address) => {
    const response = await fetch(
      `${AccountAuthAPIURL[chainId]}/contract/by-owner/${owner}`,
    );
    if (!response.ok) {
      console.log('ERROR', response.status, response.statusText);
      const content = await response.text();
      console.log('ERROR', content);
      throw new Error(
        `Failed to get indexed smart account by owner: ${content}`,
      );
    }
    return (await response.json()) as Address[];
  },

  deploySmartAccount: async (chainId: ChainId, owner: Address) => {
    const response = await fetch(
      `${AccountAuthAPIURL[chainId]}/contract/${owner}`,
      {
        method: 'POST',
      },
    );
    return response.json() as Promise<{ contracts: Address[]; owner: Address }>;
  },

  requestNonce: async (
    chainId: ChainId,
    address: Address,
    partnerId: string,
    fields: string[],
    userId?: string,
  ) => {
    const response = await fetch(`${AccountAuthAPIURL[chainId]}/auth/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, partnerId, fields, userId }),
    });
    return (await response.json()).nonce as string;
  },

  requestToken: async (
    chainId: ChainId,
    address: Address,
    typedData: TypedDataDefinition,
    signature: string,
    nonceToken: string,
    ownerAddress?: Address, // for now, when we have the blockchain this is not required
  ) => {
    const response = await fetch(`${AccountAuthAPIURL[chainId]}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typedData,
        signature,
        nonceToken,
        address,
        ownerAddress,
      }),
    });

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
  },

  requestConsent: async (
    chainId: ChainId,
    accessToken: string,
    kinds: string[],
  ) => {
    const consentResponse = await fetch(
      `${AccountAuthAPIURL[chainId]}/me/consent/giveMany`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ kinds }),
      },
    );

    if (!consentResponse.ok) {
      const errorText = await consentResponse.text();
      console.error('Consent save failed:', consentResponse.status, errorText);
      throw new Error(`Failed to save consent: ${consentResponse.status}`);
    }

    return consentResponse.json();
  },
};

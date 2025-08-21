import type { SophonNetworkType } from '@sophon-labs/account-core';
import axios from 'axios';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { AccountServerAPI } from './constants';
import type { AuthDecodedJWT } from './types';

/**
 * Basic wrapper for the Sophon Account API calls related to authentication endpoints.
 *
 * @param network - The network to use.
 * @param partnerId - The partner ID to use.
 */
export class AuthAPIWrapper {
  private readonly apiUrl: string;
  private readonly partnerId: string;
  private readonly jwksClient: JwksClient;

  constructor(network: SophonNetworkType, partnerId: string) {
    this.apiUrl = AccountServerAPI[network];
    this.partnerId = partnerId;
    this.jwksClient = new JwksClient({
      jwksUri: this.publicKeyUrl,
      rateLimit: true,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000,
    });
  }

  /**
   * Decodes a JWT token created by Sophon and returns the decoded data.
   *
   * @param token - The JWT to decode.
   * @returns The decoded token data.
   */
  public async decodeJWT(token: string): Promise<AuthDecodedJWT> {
    const signingKey = await this.jwksClient.getSigningKey();
    const publicKey = signingKey.getPublicKey();

    const decodedToken: JwtPayload = jwt.verify(token, publicKey, {
      ignoreExpiration: false,
    }) as JwtPayload;

    return decodedToken;
  }

  /**
   * Fetches user information from Account API, if the user agreed to share any specific field,
   * they will be present in the response as well.
   *
   * The partnerId should match the one provided in the token generation.
   *
   * @param token - The JWT to decode.
   * @returns The user public information.
   */
  public async getUser(token: string) {
    const decodedToken = await this.decodeJWT(token);
    if (decodedToken.aud !== this.partnerId) {
      throw new Error(
        'Partner ID provided in the token does not match the partner ID in the token.',
      );
    }

    const response = await axios.get(`${this.apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status !== 200) {
      throw new Error('Failed to get user');
    }

    return response.data;
  }

  /**
   * Public key url json for the provided network.
   */
  public get publicKeyUrl(): string {
    return `${this.apiUrl}/.well-known/jwks.json`;
  }
}

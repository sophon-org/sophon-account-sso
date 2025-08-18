import type { SophonNetworkType } from '@sophon-labs/account-core';
import axios from 'axios';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { AccountServerAPI } from './constants';
import type { AuthDecodedJWT } from './types';

export class AuthAPIWrapper {
  private readonly apiUrl: string;
  private readonly partnerId: string;
  private publicKey: unknown;
  private readonly jwksClient: JwksClient;

  constructor(network: SophonNetworkType, partnerId: string) {
    this.apiUrl = AccountServerAPI[network];
    this.partnerId = partnerId;
    this.jwksClient = new JwksClient({
      jwksUri: this.publicKeyUrl(),
      rateLimit: true,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000,
    });
  }

  public async decodeJWT(token: string): Promise<AuthDecodedJWT> {
    const rawPk = await this.getPublicKey();
    const signingKey = await this.jwksClient.getSigningKey(rawPk.keys[0].kid);
    const publicKey = signingKey.getPublicKey();

    const decodedToken: JwtPayload = jwt.verify(token, publicKey, {
      ignoreExpiration: false,
    }) as JwtPayload;

    return decodedToken;
  }

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

  public publicKeyUrl(): string {
    return `${this.apiUrl}/.well-known/jwks.json`;
  }

  private async getPublicKey() {
    if (this.publicKey) {
      return this.publicKey;
    }

    const response = await axios.get(this.publicKeyUrl());
    if (response.status !== 200) {
      throw new Error('Failed to get public key');
    }

    this.publicKey = response.data;

    return response.data;
  }
}

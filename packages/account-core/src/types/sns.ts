import type { Address } from 'viem';

export interface SNSCacheEntry {
  name: string;
  address: Address;
  timestamp: number;
  expiresAt: number;
}

export interface SNSCache {
  [key: string]: SNSCacheEntry;
}

export type SNSName = `${string}.soph.id`;

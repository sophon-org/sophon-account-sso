import { CHAIN_CONTRACTS, type ChainId } from '@sophon-labs/account-core';
import { type Chain, sophon, sophonTestnet } from 'viem/chains';
import { env } from '@/env';

/**
 * Helper to get the contract addresses for the current chain.
 */
export const CONTRACTS =
  CHAIN_CONTRACTS[env.NEXT_PUBLIC_CHAIN_ID.toString() as ChainId];

export const CHAIN_ID_TO_CHAIN: Record<ChainId, Chain> = {
  '531050104': sophonTestnet,
  '50104': sophon,
};

/**
 * Syntactic sugar for getting the viem chain.
 */
export const SOPHON_VIEM_CHAIN: Chain =
  CHAIN_ID_TO_CHAIN[env.NEXT_PUBLIC_CHAIN_ID.toString() as ChainId];

export const BLOCK_EXPLORER_URL_BY_CHAIN: Record<ChainId, string> = {
  '531050104': 'https://explorer.testnet.sophon.xyz',
  '50104': 'https://explorer.sophon.xyz',
};

/**
 * Helper to get the block explorer url for the current chain.
 */
export const BLOCK_EXPLORER_URL =
  BLOCK_EXPLORER_URL_BY_CHAIN[env.NEXT_PUBLIC_CHAIN_ID.toString() as ChainId];

export const BLOCK_EXPLORER_API_URL_BY_CHAIN: Record<ChainId, string> = {
  '531050104': 'https://block-explorer-api.testnet.sophon.xyz',
  '50104': 'https://api-explorer.sophon.xyz',
};

/**
 * Helper to get the block explorer url for the current chain.
 */
export const BLOCK_EXPLORER_API_URL =
  BLOCK_EXPLORER_API_URL_BY_CHAIN[
    env.NEXT_PUBLIC_CHAIN_ID.toString() as ChainId
  ];

/**
 * Helper to get the local storage key for the account.
 */
export const LOCAL_STORAGE_KEY = 'sophon-account';

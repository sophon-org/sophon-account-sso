import { type Chain, sophon, sophonTestnet } from 'viem/chains';
import { env } from '@/env';
import type { ContractAddresses } from './types';

/**
 * Chain IDs for the supported chains, only add chains here that are supported by the app on the basic level.
 * For mechanics like bridging, this is not the place to add them.
 */
export type ChainId = `531050104` | `50104`;

/**
 * Map of chain IDs to their corresponding contract addresses. New contracts should be added to all supported chains.
 */
export const CHAIN_CONTRACTS: Record<ChainId, ContractAddresses> = {
  '531050104': {
    session: '0x3E9AEF9331C4c558227542D9393a685E414165a3',
    allowedSession: '0x8013Ba90392efa67CC6479A2DD4Cd38f29e759C4',
    passkey: '0xA00d13Be54c485a8A7B02a01067a9F257A614074',
    accountFactory: '0x9Bb2603866dD254d4065E5BA50f15F8F058F600E',
    accountPaymaster: '0x98546B226dbbA8230cf620635a1e4ab01F6A99B2',
    recovery: '0x4c15F20fb91Fb90d2ba204194E312b595F75709F',
    oidcKeyRegistry: '0x0000000000000000000000000000000000000000',
    recoveryOidc: '0x0000000000000000000000000000000000000000',
  },
  '50104': {
    session: '0x3E9AEF9331C4c558227542D9393a685E414165a3',
    allowedSession: '0x8013Ba90392efa67CC6479A2DD4Cd38f29e759C4',
    passkey: '0xA00d13Be54c485a8A7B02a01067a9F257A614074',
    accountFactory: '0x9Bb2603866dD254d4065E5BA50f15F8F058F600E',
    accountPaymaster: '0x0000000000000000000000000000000000000000',
    recovery: '0x4c15F20fb91Fb90d2ba204194E312b595F75709F',
    oidcKeyRegistry: '0x0000000000000000000000000000000000000000',
    recoveryOidc: '0x0000000000000000000000000000000000000000',
  },
};

/**
 * Helper to get the contract addresses for the current chain.
 */
export const CONTRACTS =
  CHAIN_CONTRACTS[env.NEXT_PUBLIC_CHAIN_ID.toString() as ChainId];

export const CHAIN_ID_TO_CHAIN: Record<ChainId, Chain> = {
  // '531050104': {
  //   ...sophonTestnet,
  //   rpcUrls: { default: { http: ['http://0.0.0.0:8011'] } },
  // },
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

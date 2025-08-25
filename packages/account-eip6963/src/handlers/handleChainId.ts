import type { SophonNetworkType } from '@sophon-labs/account-core';
import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from '../lib/constants';

/**
 * Handle the eth_accounts request. We just support sophon mainnet and testnet.
 *
 * @param network - The network to use.
 * @returns The packed chain id for the given network.
 */
export const handleChainId = async (network: SophonNetworkType) => {
  if (network === 'mainnet') {
    return MAINNET_CHAIN_ID; // mainnet chain id
  }
  return TESTNET_CHAIN_ID; // testnet chain id
};

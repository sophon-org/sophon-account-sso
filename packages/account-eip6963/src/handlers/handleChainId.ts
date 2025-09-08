import {
  MAINNET_HEX_CHAIN_ID,
  type SophonNetworkType,
  TESTNET_HEX_CHAIN_ID,
} from '@sophon-labs/account-core';

/**
 * Handle the eth_accounts request. We just support sophon mainnet and testnet.
 *
 * @param network - The network to use.
 * @returns The packed chain id for the given network.
 */
export const handleChainId = async (network: SophonNetworkType) => {
  if (network === 'mainnet') {
    return MAINNET_HEX_CHAIN_ID; // mainnet chain id
  }
  return TESTNET_HEX_CHAIN_ID; // testnet chain id
};

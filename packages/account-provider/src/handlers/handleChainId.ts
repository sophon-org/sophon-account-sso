import { type ChainId, SophonHexChainId } from '@sophon-labs/account-core';

/**
 * Handle the eth_accounts request. We just support sophon mainnet and testnet.
 *
 * @param chainId - The chainId to use.
 * @returns The packed chain id for the given chainId.
 */
export const handleChainId = async (chainId: ChainId) => {
  return SophonHexChainId[chainId];
};

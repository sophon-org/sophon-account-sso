import { type ChainId, SophonHexChainId } from '@sophon-labs/account-core';
import type { Address } from 'viem';

/**
 * Handle the wallet_switchEthereumChain request. We only support two networks:
 * - mainnet
 * - testnet
 *
 * So we just allow the user to switch between them.
 *
 * @param network - The network to use.
 * @param params - The parameters of the request.
 * @returns The result of the request.
 */
export const handleSwitchEthereumChain = async (
  chainId: ChainId,
  params?: unknown[],
) => {
  const firstParam = params?.[0] as { chainId: Address };
  const targetChainId = firstParam?.chainId;

  if (Object.values(SophonHexChainId).includes(targetChainId)) {
    return null; // Success
  } else {
    throw new Error(
      `Unsupported chain on chainId ${chainId}: ${targetChainId ? parseInt(targetChainId, 16) : targetChainId}`,
    );
  }
};

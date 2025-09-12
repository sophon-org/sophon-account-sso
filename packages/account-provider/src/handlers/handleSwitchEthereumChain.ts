import {
  MAINNET_HEX_CHAIN_ID,
  type SophonNetworkType,
  TESTNET_HEX_CHAIN_ID,
} from '@sophon-labs/account-core';

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
  network: SophonNetworkType,
  params?: unknown[],
) => {
  const firstParam = params?.[0] as { chainId: string };
  const targetChainId = firstParam?.chainId;

  if ([MAINNET_HEX_CHAIN_ID, TESTNET_HEX_CHAIN_ID].includes(targetChainId)) {
    return null; // Success
  } else {
    throw new Error(
      `Unsupported chain on network ${network}: ${targetChainId ? parseInt(targetChainId, 16) : targetChainId}`,
    );
  }
};

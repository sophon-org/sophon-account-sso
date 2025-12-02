import type { TypedDataDefinition } from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import type { ChainId, LegacyChainId, OSChainId } from './constants';
import { sophonOS } from './os/osMainnet';
import { sophonOSTestnet } from './os/osTestnet';
import type { TypedDataSigningRequest } from './types';

/**
 * Safe parse the typed data domain chainId.This is required because of different payloads
 * used by different RPC providers, like ethers and dynamic SDK.
 *
 * @param typedData - The typed data to parse.
 * @returns The correct expected typed data.
 */
export const safeParseTypedData = (
  typedData: TypedDataDefinition | TypedDataSigningRequest,
) => {
  if (!typedData.domain?.chainId) {
    return typedData;
  }

  // ethers sends the chainId encoded as a string, so we need to convert it to a number.
  // Dynamic SDK supports only numeric chainId.
  let chainId = typedData.domain.chainId;
  if (typeof chainId === 'string') {
    const typedChainId = chainId as string;
    if (typedChainId.startsWith('0x')) {
      chainId = Number.parseInt(typedChainId.slice(2), 16);
    } else {
      chainId = Number.parseInt(typedChainId, 10);
    }
  }

  return {
    ...typedData,
    domain: {
      ...typedData.domain,
      chainId,
    },
  };
};

/**
 * Parses a chain ID from environment variable string to ChainId type
 * @param envChainId - The chain ID from environment variable (string)
 * @returns Validated ChainId number
 */
export const parseChainId = (id: string | undefined): ChainId => {
  if (!id) {
    throw new Error('CHAIN_ID environment variable is not set');
  }

  const chainId = Number(id);

  if (Number.isNaN(chainId)) {
    throw new Error(`Invalid CHAIN_ID: ${id}`);
  }

  return chainId as ChainId;
};

export const isChainId = (id: number): id is ChainId => {
  return isOsChainId(id) || isLegacyChainId(id);
};

/**
 * Checks if chain is a Sophon OS chain
 */
export const isOsChainId = (id: number): id is OSChainId => {
  return id === sophonOS.id || id === sophonOSTestnet.id;
};

/**
 * Checks if chain is a legacy chain
 */
export const isLegacyChainId = (id: number): id is LegacyChainId => {
  return id === sophon.id || id === sophonTestnet.id;
};

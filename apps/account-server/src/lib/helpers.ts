import type { TypedDataDefinition } from 'viem';
import type { TypedDataSigningRequest } from '@/types/auth';

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

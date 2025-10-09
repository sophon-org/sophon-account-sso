import type { TypedDataDefinition } from 'viem';
import type { TypedDataSigningRequest } from '@/types/auth';

/**
 * Safe parse the typed data domain chainId.This is required because of different payloads
 * used by different RPC providers, like ethers and openfort SDK.
 *
 * @param typedData - The typed data to parse.
 * @returns The correct expected typed data.
 */
export const safeParseTypedData = (
  typedData: TypedDataDefinition | TypedDataSigningRequest,
) => {
  console.log('safeParseTypedData', typedData);
  if (!typedData.domain?.chainId) {
    console.log('returning typedData');
    return typedData;
  }

  // ethers sends the chainId encoded as a string, so we need to convert it to a number.
  // Openfort SDK supports only numeric chainId.
  let chainId = typedData.domain.chainId;
  if (typeof chainId === 'string') {
    const typedChainId = chainId as string;
    console.log('typedChainId', typedChainId);
    if (typedChainId.startsWith('0x')) {
      chainId = Number.parseInt(typedChainId.slice(2), 16);
    } else {
      chainId = Number.parseInt(typedChainId, 10);
    }
  }

  console.log('returning typedData', {
    ...typedData,
    domain: {
      ...typedData.domain,
      chainId,
    },
  });

  return {
    ...typedData,
    domain: {
      ...typedData.domain,
      chainId,
    },
  };
};

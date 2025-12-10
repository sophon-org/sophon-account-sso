import {
  concat,
  domainSeparator,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
} from 'viem';
import type { TypedDataSigningRequest } from '@/types/auth';

type BiconomyTypedData = TypedDataSigningRequest & {
  contentsHash: `0x${string}`;
};

/**
 * Builds the Biconomy typed data payload for the given payload.
 * @param payload - The payload to build the Biconomy typed data payload for.
 * @returns The Biconomy typed data payload.
 */
// TODO: remove this in the future, when Biconomy supports the new typed data format

export const buildBiconomyTypedDataPayload = (
  payload: TypedDataSigningRequest,
): BiconomyTypedData | null => {
  const primaryTypeFields = payload.types[payload.primaryType];
  if (!primaryTypeFields?.length) {
    return null;
  }

  try {
    const abiDefinition = primaryTypeFields
      .map((field) => field.type)
      .join(',');
    const abiValues = primaryTypeFields.map(
      (field) => payload.message[field.name],
    );

    if (abiValues.some((value) => typeof value === 'undefined')) {
      return null;
    }

    const stuff = keccak256(
      encodeAbiParameters(
        parseAbiParameters(abiDefinition),
        abiValues as readonly unknown[],
      ),
    );

    const contentsHash = keccak256(
      concat(['0x1901', domainSeparator({ domain: payload.domain }), stuff]),
    );

    return {
      ...payload,
      primaryType: 'Contents',
      types: {
        Contents: [
          {
            name: 'stuff',
            type: 'bytes32',
          },
        ],
      },
      message: {
        stuff,
      },
      contentsHash,
    };
  } catch (error) {
    console.error('Failed to build Biconomy typed data payload', error);
    return null;
  }
};

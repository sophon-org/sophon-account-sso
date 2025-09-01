import {
  type Address,
  concat,
  createPublicClient,
  type Hash,
  type Hex,
  hashMessage,
  hashTypedData,
  http,
  keccak256,
  type SignableMessage,
  toBytes,
  toHex,
} from 'viem';

import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';

export const DYNAMIC_SALT_PREFIX = 'DynamicLabs';
export const SOPHON_SALT_PREFIX = 'SophonLabs';

export const getDynamicSmartAccountUniqueId = (ownerAddress: Address) => {
  const generatedSalt = `0x${Buffer.from(toBytes(DYNAMIC_SALT_PREFIX, { size: 32 })).toString('hex')}`;
  const salt = keccak256(
    concat([toBytes(keccak256(toHex(generatedSalt))), toBytes(ownerAddress)]),
  );

  return salt;
};

export const getSophonSmartAccountUniqueId = (
  ownerAddress: Address,
  deployAccount: Address,
) => {
  const uniqueIds: Hex[] = [toHex(SOPHON_SALT_PREFIX), ownerAddress];
  const partialSalt = keccak256(toHex(concat(uniqueIds)));

  const salt = keccak256(
    concat([toBytes(partialSalt), toBytes(deployAccount)]),
  );
  return salt;
};

export const getAccountAddressByUniqueId = async (uniqueId: Hash) => {
  const publicClient = createPublicClient({
    chain: SOPHON_VIEM_CHAIN,
    transport: http(),
  });

  try {
    const existingAccountAddress = await publicClient.readContract({
      address: CONTRACTS.accountFactory,
      abi: [
        {
          name: 'accountMappings',
          inputs: [{ name: 'accountId', type: 'bytes32' }],
          outputs: [{ name: 'deployedAccount', type: 'address' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'accountMappings',
      args: [uniqueId],
    });

    console.log('Existing account:', existingAccountAddress);

    return existingAccountAddress;
  } catch (checkError) {
    console.log('Account check failed:', checkError);
  }
};

export const verifySignature = async ({
  accountAddress,
  signature,
  message,
  signatureType,
  domain,
  types,
  primaryType,
}: {
  accountAddress: string;
  signature: string;
  message: Record<string, unknown> | SignableMessage;
  signatureType: 'EIP1271' | 'EIP-191';
  domain?: {
    name?: string;
    version?: string;
    chainId?: number | bigint;
    verifyingContract?: `0x${string}`;
    salt?: `0x${string}`;
  };
  types?: Record<string, readonly unknown[]>;
  primaryType?: string;
}) => {
  try {
    const publicClient = createPublicClient({
      chain: VIEM_CHAIN,
      transport: http(),
    });

    let messageHash: `0x${string}`;

    if (signatureType === 'EIP-191') {
      messageHash = hashMessage(message as SignableMessage);
    } else {
      if (!domain || !types || !primaryType) {
        throw new Error(
          'Missing required parameters for EIP-1271 verification',
        );
      }

      messageHash = hashTypedData({
        domain,
        types,
        primaryType,
        message: message as Record<string, unknown>,
      });
    }

    // Call isValidSignature on the SsoAccount contract
    const result = await publicClient.readContract({
      address: accountAddress as `0x${string}`,
      abi: [
        {
          name: 'isValidSignature',
          inputs: [
            { name: 'hash', type: 'bytes32' },
            { name: 'signature', type: 'bytes' },
          ],
          outputs: [{ name: '', type: 'bytes4' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'isValidSignature',
      args: [messageHash, signature as `0x${string}`],
    });

    // EIP-1271 magic value for valid signature
    const EIP1271_MAGIC_VALUE = '0x1626ba7e';
    const isValid = result === EIP1271_MAGIC_VALUE;

    return isValid;
  } catch (error) {
    console.error('❌ EIP-1271 verification failed:', error);
    return false;
  }
};

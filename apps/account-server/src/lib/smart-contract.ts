import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  type Address,
  concat,
  createPublicClient,
  encodePacked,
  hashMessage,
  hashTypedData,
  http,
  keccak256,
  type SignableMessage,
  toBytes,
  toHex,
} from 'viem';

import { CONTRACTS, VIEM_CHAIN } from '@/lib/constants';

const SALT_PREFIX = 'DynamicLabs';
//const SALT_PREFIX = "SophonLabs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TODO: change this implementation to a indexed one
export const isAccountDeployed = async (connectedAddress: string) => {
  const existingAccountAddress = await checkAccountOwnership(
    connectedAddress,
    process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS as `0x${string}`,
  );
  return (
    existingAccountAddress &&
    existingAccountAddress !== '0x0000000000000000000000000000000000000000'
  );
};

export const getSmartAccountUniqueId = (ownerAddress: Address) => {
  const salt = `0x${Buffer.from(toBytes(SALT_PREFIX, { size: 32 })).toString(
    'hex',
  )}` as `0x${string}`;

  const uniqueIds: `0x${string}`[] = [];
  uniqueIds.push(toHex(salt));
  uniqueIds.push(ownerAddress as `0x${string}`);
  const transformedUniqueId = keccak256(toHex(concat(uniqueIds)));

  return transformedUniqueId;
};

export const getSmartAccountAddress = (
  ownerAddress: Address,
  deployerAddress?: Address,
) => {
  const knownUniqueId = getSmartAccountUniqueId(ownerAddress);

  return keccak256(
    encodePacked(
      ['bytes32', 'address'],
      [
        knownUniqueId as `0x${string}`,
        (deployerAddress ?? ownerAddress) as `0x${string}`,
      ],
    ),
  );
};

export const checkAccountOwnership = async (
  connectedAddress: string,
  deployerAddress: Address,
) => {
  const publicClient = createPublicClient({
    chain: VIEM_CHAIN,
    transport: http(),
  });

  const salt = `0x${Buffer.from(toBytes(SALT_PREFIX, { size: 32 })).toString(
    'hex',
  )}` as `0x${string}`;

  const uniqueIds: `0x${string}`[] = [];
  uniqueIds.push(toHex(salt));
  uniqueIds.push(connectedAddress as `0x${string}`);
  const transformedUniqueId = keccak256(toHex(concat(uniqueIds)));

  const knownUniqueId = transformedUniqueId;

  try {
    const uniqueAccountId = keccak256(
      encodePacked(
        ['bytes32', 'address'],
        [knownUniqueId as `0x${string}`, connectedAddress as `0x${string}`],
        //[knownUniqueId as `0x${string}`, deployerAddress as `0x${string}`]
      ),
    );
    console.log(
      'calaulating',
      uniqueAccountId,
      'connected address',
      connectedAddress,
      'for deployer',
      deployerAddress,
    );

    const existingAccountAddress = await publicClient.readContract({
      address: CONTRACTS.accountFactory as `0x${string}`,
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
      args: [uniqueAccountId],
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

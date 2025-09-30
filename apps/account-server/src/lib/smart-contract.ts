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
  zeroAddress,
} from 'viem';
import { env } from '@/env';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';

export const DYNAMIC_SALT_PREFIX = 'DynamicLabs';
export const SOPHON_SALT_PREFIX = 'SophonLabs';

/**
 * Returns the uniqueId for a dynamic created account, on sophon account v1.
 * Here we used a salt prefix exclusive to dynamic and the owner was the deployer as well.
 *
 * @param ownerAddress - The address of the owner of the account
 * @returns The uniqueId
 */
export const getDynamicSmartAccountUniqueId = (ownerAddress: Address) => {
  const generatedSalt = `0x${Buffer.from(toBytes(DYNAMIC_SALT_PREFIX, { size: 32 })).toString('hex')}`;
  const salt = keccak256(
    concat([toBytes(keccak256(toHex(generatedSalt))), toBytes(ownerAddress)]),
  );

  return salt;
};

/**
 * Returns the final uniqueAccountId for a sophon account v2 deployed account. On this version
 * we deploy the account on the backend, and because of that the owner is not the message sender
 *
 * @param ownerAddress - The address of the owner of the account
 * @param deployAccount - The address of the account that deployed the account
 * @returns The final uniqueAccountId
 */
export const getSophonSmartAccountUniqueId = (
  ownerAddress: Address,
  deployAccount: Address,
) => {
  const uniqueIds: Hex[] = [
    toHex(SOPHON_SALT_PREFIX),
    ownerAddress.toLowerCase() as `0x${string}`,
  ];
  const uniqueId = keccak256(toHex(concat(uniqueIds)));
  const uniqueAccountId = keccak256(
    concat([toBytes(uniqueId), toBytes(deployAccount)]),
  );

  return uniqueAccountId;
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
      chain: SOPHON_VIEM_CHAIN,
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

export const getDeployedSmartContractAddress = async (
  ownerAddress: Address,
) => {
  const [dynamicAccountAddress, sophonAccountAddress] = await Promise.all([
    getAccountAddressByUniqueId(getDynamicSmartAccountUniqueId(ownerAddress)),
    getAccountAddressByUniqueId(
      getSophonSmartAccountUniqueId(
        ownerAddress,
        env.NEXT_PUBLIC_DEPLOYER_ADDRESS as `0x${string}`,
      ),
    ),
  ]);

  if (dynamicAccountAddress && dynamicAccountAddress !== zeroAddress) {
    return dynamicAccountAddress;
  }

  if (sophonAccountAddress && sophonAccountAddress !== zeroAddress) {
    return sophonAccountAddress;
  }

  return null;
};

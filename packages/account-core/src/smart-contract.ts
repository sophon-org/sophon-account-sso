import {
  type Address,
  type Chain,
  concat,
  createPublicClient,
  type Hash,
  type Hex,
  http,
  keccak256,
  toBytes,
  toHex,
  zeroAddress,
} from 'viem';
import { CHAIN_CONTRACTS } from './constants';

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

export const getAccountAddressByUniqueId = async (
  chain: Chain,
  uniqueId: Hash,
) => {
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    const existingAccountAddress = await publicClient.readContract({
      address:
        CHAIN_CONTRACTS[`${chain.id}` as `531050104` | `50104`].accountFactory,
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

export const getDeployedSmartContractAddress = async (
  chain: Chain,
  ownerAddress: Address,
  deployerAddress: Address,
) => {
  const [dynamicAccountAddress, sophonAccountAddress] = await Promise.all([
    getAccountAddressByUniqueId(
      chain,
      getDynamicSmartAccountUniqueId(ownerAddress),
    ),
    getAccountAddressByUniqueId(
      chain,
      getSophonSmartAccountUniqueId(ownerAddress, deployerAddress),
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

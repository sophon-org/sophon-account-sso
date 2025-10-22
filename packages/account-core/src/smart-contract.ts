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
import { sophonTestnet } from 'viem/chains';
import { sophonAAFactoryAbi, sophonAccountCodeStorageAbi } from './abis';
import { CHAIN_CONTRACTS, type ChainId, SophonChains } from './constants';
import type { AAFactoryAccount } from './types/storage';

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

    return existingAccountAddress;
  } catch {
    // ignore errors
    return null;
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

/**
 * Returns true if the address is a Sophon account
 * @param address - The address of the account to check
 * @param chainId - The chain ID to use for the client
 * @param rpcUrl - A custom RPC URL to use for the client
 * @returns True if the address is a Sophon account, false otherwise
 */
export const isSophonAccount = async (
  address: string,
  chainId: ChainId = sophonTestnet.id,
  rpcUrl?: string,
) => {
  const client = createPublicClient({
    chain: SophonChains[chainId],
    transport: http(rpcUrl),
  });

  const account = (await client.readContract({
    address: CHAIN_CONTRACTS[chainId].accountFactory,
    abi: sophonAAFactoryAbi,
    functionName: 'getAccount',
    args: [address],
  })) as AAFactoryAccount;

  return account.accountId !== zeroAddress;
};

/**
 * Returns true if the address is an EraVM contract(An EraVM contract is a contract compiled by zkzsolc and deployed on the zkVM)
 * @param address - The address of the contract to check
 * @param testnet - Whether to use the testnet chain
 * @param customRpc - A custom RPC URL to use for the client
 * @returns True if the address is an EraVM contract, false otherwise
 */
export const isEraVMContract = async (
  address: `0x${string}`,
  chainId: ChainId = sophonTestnet.id,
  customRpc?: string,
) => {
  const client = createPublicClient({
    chain: SophonChains[chainId],
    transport: http(customRpc),
  });

  const code = await client.getCode({ address });
  if (!code || code === '0x') {
    return false;
  }

  const isAccountEVM = await client.readContract({
    address: CHAIN_CONTRACTS[chainId].accountCodeStorage,
    abi: sophonAccountCodeStorageAbi,
    functionName: 'isAccountEVM',
    args: [address],
  });

  return !isAccountEVM;
};

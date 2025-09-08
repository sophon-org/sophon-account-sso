import {
  type Address,
  createPublicClient,
  http,
  isAddress,
  namehash,
  pad,
  toHex,
} from 'viem';
import { sophon, sophonTestnet } from 'viem/chains';
import { snsRegistryAbi } from '../abis/SNSRegistryAbi';
import {
  CHAIN_CONTRACTS,
  MAINNET_CHAIN_ID,
  TESTNET_CHAIN_ID,
} from '../constants';
import type { StorageLike } from '../types';
import { cachedSNS } from './cache';

export type { SNSName } from './types';

/**
 * Resolve a name to an address on sophon network
 *
 * @param name - The name to resolve
 * @param testnet - Whether to use the testnet or mainnet
 * @param rpcUrl - The RPC URL to use. If not provided, the default RPC URL will be used
 *
 * @returns The address attached to the name or null if the name is not found
 */
export const resolveName = async (
  name: string,
  testnet: boolean = true,
  rpcUrl?: string,
): Promise<Address | null> => {
  const client = createPublicClient({
    chain: testnet ? sophonTestnet : sophon,
    transport: http(rpcUrl),
  });

  if (isAddress(name)) {
    throw new Error('An address is not a valid name');
  }

  // Clean up in case it was provided with the .soph.id suffix
  const _name = `${name.toLowerCase().replace('.soph.id', '')}.soph.id`;

  const hash = namehash(_name);

  const resolved = await client.readContract({
    address:
      CHAIN_CONTRACTS[testnet ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID]
        .snsRegistry,
    abi: snsRegistryAbi,
    functionName: 'addr',
    args: [hash],
  });

  if (resolved === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  return resolved as Address;
};

/**
 * Resolve an address to a name on sophon network
 *
 * @param address - The address to resolve
 * @param testnet - Whether to use the testnet or mainnet
 * @param rpcUrl - The RPC URL to use. If not provided, the default RPC URL will be used
 *
 * @returns The name attached to the address or null if the address is not found
 */
export const resolveAddress = async (
  address: string,
  testnet: boolean = true,
  rpcUrl?: string,
): Promise<string | null> => {
  const client = createPublicClient({
    chain: testnet ? sophonTestnet : sophon,
    transport: http(rpcUrl),
  });

  if (!isAddress(address)) {
    throw new Error('You provided an invalid address');
  }

  const tokenId = await client.readContract({
    address:
      CHAIN_CONTRACTS[testnet ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID]
        .snsRegistry,
    abi: snsRegistryAbi,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, 0],
  });

  if (!tokenId) {
    return null;
  }

  const nameHash = pad(toHex(tokenId as bigint), { size: 32 });

  const name = await client.readContract({
    address:
      CHAIN_CONTRACTS[testnet ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID]
        .snsRegistry,
    abi: snsRegistryAbi,
    functionName: 'name',
    args: [nameHash],
  });

  return `${name}.soph.id`;
};

const NoopStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

export const snsManager = (testnet: boolean = false, storage?: StorageLike) => {
  const networkId = testnet ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID;
  // make sure to not use localStorage if not in the browser context
  let currentStorage = NoopStorage;
  if (typeof window !== 'undefined') {
    currentStorage = localStorage;
  }
  const snsStorage = cachedSNS(storage ?? currentStorage);

  function isSNS(s: string) {
    return !s.endsWith('.eth') && (s.endsWith('.soph.id') || !isAddress(s));
  }

  const getSNSAddress = async (name: string): Promise<Address | null> => {
    if (!isSNS(name)) {
      return null;
    }

    return await resolveName(name, testnet);
  };

  const getSNSName = async (address: Address): Promise<string | null> => {
    if (!isAddress(address)) {
      return null;
    }

    return await resolveAddress(address, testnet);
  };

  const getCachedSNSName = (address: Address): string | null => {
    if (!isAddress(address)) {
      return null;
    }

    const cachedEntry = snsStorage.getCacheEntry(address, networkId);

    if (cachedEntry) {
      return cachedEntry.name;
    }

    return null;
  };

  /**
   * Fetch SNS name for a given address
   * Returns the domain name associated with the address
   */
  const fetchSNSName = async (
    address: Address,
    onlyCache = false,
  ): Promise<string | null> => {
    if (!address) return null;

    // Check cache first
    const cachedEntry = snsStorage.getCacheEntry(address, networkId);

    if (cachedEntry) {
      return cachedEntry.name;
    }

    if (onlyCache) {
      return null;
    }

    try {
      const result = await getSNSName(address);
      if (result) {
        snsStorage.setCacheEntry(result, address, networkId);
        return result;
      }

      return null;
    } catch {
      return null;
    }
  };

  /**
   * Resolve address for a given SNS name
   * Returns the address associated with the domain name
   */
  const resolveSNSName = async (
    name: string,
    onlyCache = false,
  ): Promise<Address | null> => {
    if (!name) return null;

    // Check cache first
    const cachedEntry = snsStorage.getCacheEntry(name, networkId);
    if (cachedEntry) {
      return cachedEntry.address;
    }

    if (onlyCache) {
      return null;
    }

    try {
      const result = await getSNSAddress(name);

      if (result) {
        snsStorage.setCacheEntry(name, result, networkId);
        return result;
      }

      return null;
    } catch {
      return null;
    }
  };

  // Clean expired entries periodically
  setInterval(snsStorage.cleanExpiredEntries, 60 * 60 * 1000); // Every hour

  return {
    fetchSNSName,
    getCachedSNSName,
    resolveSNSName,
  };
};

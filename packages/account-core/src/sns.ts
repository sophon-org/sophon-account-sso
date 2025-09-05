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
import { snsRegistryAbi } from './abis/SNSRegistryAbi';
import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from './constants';

const SNS_REGISTRY_ADDRESS = '0xc1Ef891D1b17AB8E1af3a8Bb24cdA68aBfFD1F49';

export type SNSName = `${string}.soph.id`;

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
    address: SNS_REGISTRY_ADDRESS,
    abi: snsRegistryAbi,
    functionName: 'addr',
    args: [hash],
  });

  if (resolved === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  return resolved as Address;
};

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
    address: SNS_REGISTRY_ADDRESS,
    abi: snsRegistryAbi,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, 0],
  });

  if (!tokenId) {
    return null;
  }

  const nameHash = pad(toHex(tokenId as bigint), { size: 32 });

  const name = await client.readContract({
    address: SNS_REGISTRY_ADDRESS,
    abi: snsRegistryAbi,
    functionName: 'name',
    args: [nameHash],
  });

  return `${name}.soph.id`;
};
export interface _snsCacheEntry {
  name: string;
  address: Address;
  timestamp: number;
  expiresAt: number;
}

export interface _snsCache {
  [key: string]: _snsCacheEntry;
}

// Cache duration: 7 days in milliseconds
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// localStorage key for SNS cache
const STORAGE_KEY = 'sns-cache';

/**
 * Load cache from localStorage
 */
const loadCacheFromStorage = (): _snsCache => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored) as _snsCache;

    // Clean expired entries while loading
    const now = Date.now();
    const validEntries: _snsCache = {};

    for (const [key, entry] of Object.entries(parsed)) {
      if (now < entry.expiresAt) {
        validEntries[key] = entry;
      }
    }

    return validEntries;
  } catch (error) {
    console.warn('Failed to load SNS cache from localStorage:', error);
    return {};
  }
};

/**
 * Save cache to localStorage
 */
const saveCacheToStorage = (cache: _snsCache): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save SNS cache to localStorage:', error);
  }
};

// Initialize cache from localStorage
let _snsCache: _snsCache = loadCacheFromStorage();

/**
 * Check if a cache entry is still valid (not older than 24 hours)
 */
const isCacheEntryValid = (entry: _snsCacheEntry): boolean => {
  return Date.now() < entry.expiresAt;
};

/**
 * Get cache entry by name or address
 */
const getCacheEntry = (
  key: string,
  networkId: number,
): _snsCacheEntry | null => {
  const _key = `${key}:${networkId}`;
  const entry = _snsCache[_key];
  if (entry && isCacheEntryValid(entry)) {
    return entry;
  }

  // Remove expired entry
  if (entry) {
    delete _snsCache[_key];
    saveCacheToStorage(_snsCache);
  }

  return null;
};

/**
 * Store entry in cache with bi-directional mapping
 */
const setCacheEntry = (
  name: string,
  address: Address,
  networkId: number,
): void => {
  const timestamp = Date.now();
  const expiresAt = timestamp + CACHE_DURATION;

  const entry: _snsCacheEntry = {
    name,
    address,
    timestamp,
    expiresAt,
  };

  // Store bi-directional mapping
  _snsCache[`${name}:${networkId}`] = entry;
  _snsCache[`${address}:${networkId}`] = entry;

  // Persist to localStorage
  saveCacheToStorage(_snsCache);
};

/**
 * Clear expired entries from cache
 */
const cleanExpiredEntries = (): void => {
  const now = Date.now();
  const entries = Object.entries(_snsCache);
  let hasChanges = false;

  for (const [key, entry] of entries) {
    if (now >= entry.expiresAt) {
      delete _snsCache[key];
      hasChanges = true;
    }
  }

  // Only save to localStorage if there were changes
  if (hasChanges) {
    saveCacheToStorage(_snsCache);
  }
};

export const snsCache = (testnet: boolean = false) => {
  const networkId = testnet ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID;

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

    const cachedEntry = getCacheEntry(address, networkId);

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
    const cachedEntry = getCacheEntry(address, networkId);

    if (cachedEntry) {
      return cachedEntry.name;
    }

    if (onlyCache) {
      return null;
    }

    try {
      const result = await getSNSName(address);
      if (result) {
        setCacheEntry(result, address, networkId);
        return result;
      }

      return null;
    } catch (_error) {
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
    const cachedEntry = getCacheEntry(name, networkId);
    if (cachedEntry) {
      return cachedEntry.address;
    }

    if (onlyCache) {
      return null;
    }

    try {
      const result = await getSNSAddress(name);

      if (result) {
        setCacheEntry(name, result, networkId);
        return result;
      }

      return null;
    } catch (_error) {
      return null;
    }
  };

  /**
   * Clear all cache entries
   */
  const clearCache = (): void => {
    _snsCache = {};
    saveCacheToStorage(_snsCache);
  };

  /**
   * Get all cached entries (for debugging/monitoring)
   */
  const getCachedEntries = (): _snsCacheEntry[] => {
    return Object.values(_snsCache).filter(isCacheEntryValid);
  };

  /**
   * Check if a specific entry exists in cache
   */
  const isCached = (key: string): boolean => {
    return getCacheEntry(key, networkId) !== null;
  };

  // Clean expired entries periodically
  setInterval(cleanExpiredEntries, 60 * 60 * 1000); // Every hour

  return {
    // Main functions
    fetchSNSName,
    getCachedSNSName,
    resolveSNSName,
    // Cache utilities
    clearCache,
    getCachedEntries,
    isCached,
  };
};

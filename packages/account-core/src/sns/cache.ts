import type { Address } from 'viem';
import type { ChainId } from '../constants';
import { SNS_CACHE_DURATION, SNS_STORAGE_KEY } from '../constants';
import type { StorageLike } from '../types';
import type { SNSCache, SNSCacheEntry } from '../types/sns';

export const cachedSNS = (storage: StorageLike) => {
  /**
   * Load cache from provided storage
   */
  const loadCacheFromStorage = (): SNSCache => {
    try {
      const stored = storage.getItem(SNS_STORAGE_KEY);
      if (!stored) return {};

      const parsed = JSON.parse(stored) as SNSCache;

      // Clean expired entries while loading
      const now = Date.now();
      const validEntries: SNSCache = {};

      for (const [key, entry] of Object.entries(parsed)) {
        if (now < entry.expiresAt) {
          validEntries[key] = entry;
        }
      }

      return validEntries;
    } catch (error) {
      console.warn('Failed to load SNS cache from storage:', error);
      return {};
    }
  };

  /**
   * Save cache to storage
   */
  const saveCacheToStorage = (cache: SNSCache): void => {
    try {
      storage.setItem(SNS_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to save SNS cache to storage:', error);
    }
  };

  // Initialize cache from storage
  let _snsCache: SNSCache = loadCacheFromStorage();

  /**
   * Check if a cache entry is still valid (not older than 24 hours)
   */
  const isCacheEntryValid = (entry: SNSCacheEntry): boolean => {
    return Date.now() < entry.expiresAt;
  };

  /**
   * Get cache entry by name or address
   */
  const getCacheEntry = (
    key: string,
    networkId: ChainId,
  ): SNSCacheEntry | null => {
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
    networkId: ChainId,
  ): void => {
    const timestamp = Date.now();
    const expiresAt = timestamp + SNS_CACHE_DURATION;

    const entry: SNSCacheEntry = {
      name,
      address,
      timestamp,
      expiresAt,
    };

    // Store bi-directional mapping
    _snsCache[`${name}:${networkId}`] = entry;
    _snsCache[`${address}:${networkId}`] = entry;

    // Persist to storage
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

    // Only save to storage if there were changes
    if (hasChanges) {
      saveCacheToStorage(_snsCache);
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
  const getCachedEntries = (): SNSCacheEntry[] => {
    return Object.values(_snsCache).filter(isCacheEntryValid);
  };

  /**
   * Check if a specific entry exists in cache
   */
  const isCached = (key: string, networkId: ChainId): boolean => {
    return getCacheEntry(key, networkId) !== null;
  };

  return {
    getCacheEntry,
    setCacheEntry,
    cleanExpiredEntries,
    clearCache,
    getCachedEntries,
    isCached,
  };
};

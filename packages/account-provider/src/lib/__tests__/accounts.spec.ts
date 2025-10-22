import type { StorageLike } from '@sophon-labs/account-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { sophonTestnet } from 'viem/chains';
import { clearAccounts, getAccounts, setAccounts } from '../../lib/accounts';

describe('Provider > Lib > accounts storage', () => {
  let mockStorage: StorageLike;

  beforeEach(() => {
    // Create a new mock storage before each test
    const storage = new Map<string, string>();
    mockStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    };
  });

  it('should return empty array if no accounts are set', () => {
    // given
    const chainId = sophonTestnet.id;
    clearAccounts(mockStorage, chainId);

    // when
    const result = getAccounts(mockStorage, chainId);

    // then
    expect(result).toEqual([]);
  });

  it('should return the accounts for the given chainId', () => {
    // given
    const chainId = sophonTestnet.id;
    const accounts = ['0x1234567890123456789012345678901234567890'];
    setAccounts(mockStorage, chainId, accounts);

    // when
    const result = getAccounts(mockStorage, chainId);

    // then
    expect(result).toEqual(accounts);
  });

  it('should clear accounts for a specific chainId', () => {
    // given
    const chainId = sophonTestnet.id;
    const accounts = ['0x1234567890123456789012345678901234567890'];
    setAccounts(mockStorage, chainId, accounts);

    // when
    clearAccounts(mockStorage, chainId);
    const result = getAccounts(mockStorage, chainId);

    // then
    expect(result).toEqual([]);
  });

  it('should handle multiple chainIds independently', () => {
    // given
    const testnetChainId = sophonTestnet.id;
    const testnetAccounts = ['0x1234567890123456789012345678901234567890'];
    const mainnetChainId = 50104; // sophon mainnet
    const mainnetAccounts = ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'];

    // when
    setAccounts(mockStorage, testnetChainId, testnetAccounts);
    setAccounts(mockStorage, mainnetChainId, mainnetAccounts);

    // then
    expect(getAccounts(mockStorage, testnetChainId)).toEqual(testnetAccounts);
    expect(getAccounts(mockStorage, mainnetChainId)).toEqual(mainnetAccounts);
  });
});

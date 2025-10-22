import type { StorageLike } from '@sophon-labs/account-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { sophon, sophonTestnet } from 'viem/chains';
import { clearAccounts, setAccounts } from '../../lib/accounts';
import { handleAccounts } from '../handleAccounts';

describe('Provider > Handlers > handleAccounts', () => {
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

  it('should return the available accounts for sophonTestnet', async () => {
    // given
    const chainId = sophonTestnet.id;
    const accounts = ['0x1234567890123456789012345678901234567890'];
    setAccounts(mockStorage, chainId, accounts);

    // when
    const result = await handleAccounts(mockStorage, chainId);

    // then
    expect(result).toEqual(accounts);
  });

  it('should return the available accounts for sophon mainnet', async () => {
    // given
    const chainId = sophon.id;
    const accounts = ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'];
    setAccounts(mockStorage, chainId, accounts);

    // when
    const result = await handleAccounts(mockStorage, chainId);

    // then
    expect(result).toEqual(accounts);
  });

  it('should return an empty array if no accounts are set', async () => {
    // given
    const chainId = sophonTestnet.id;
    clearAccounts(mockStorage, chainId);

    // when
    const result = await handleAccounts(mockStorage, chainId);

    // then
    expect(result).toEqual([]);
  });
});

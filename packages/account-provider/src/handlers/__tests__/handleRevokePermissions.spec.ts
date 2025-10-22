import type { StorageLike } from '@sophon-labs/account-core';
import type EventEmitter from 'eventemitter3';
import { sophonTestnet } from 'viem/chains';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAccounts, setAccounts } from '../../lib/accounts';
import { handleRevokePermissions } from '../handleRevokePermissions';

describe('Provider > Handlers > handleRevokePermissions', () => {
  let mockStorage: StorageLike;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

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
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should clear accounts and emit accountsChanged event', async () => {
    // given
    const chainId = sophonTestnet.id;
    const account = '0x1234567890123456789012345678901234567890';
    const mockEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter;
    const sender = vi.fn().mockResolvedValueOnce({
      content: {},
    });
    setAccounts(mockStorage, chainId, [account]);

    // when
    const result = await handleRevokePermissions(
      mockStorage,
      chainId,
      sender,
      mockEmitter,
    );

    // then
    expect(sender).toHaveBeenCalledWith('wallet_revokePermissions');
    expect(result).toEqual([]);
    expect(mockEmitter.emit).toHaveBeenCalledWith('accountsChanged', []);
    expect(getAccounts(mockStorage, chainId)).toEqual([]);
  });

  it('should ignore RPC error and still clear accounts from cache', async () => {
    // given
    const chainId = sophonTestnet.id;
    const account = '0x1234567890123456789012345678901234567890';
    const mockEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter;
    const error = new Error('User Rejected');
    const sender = vi.fn().mockRejectedValueOnce(error);
    setAccounts(mockStorage, chainId, [account]);

    // when
    const result = await handleRevokePermissions(
      mockStorage,
      chainId,
      sender,
      mockEmitter,
    );

    // then
    expect(sender).toHaveBeenCalledWith('wallet_revokePermissions');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to send logout request to account server:',
      error,
    );
    expect(result).toEqual([]);
    expect(mockEmitter.emit).toHaveBeenCalledWith('accountsChanged', []);
    expect(getAccounts(mockStorage, chainId)).toEqual([]);
  });
});

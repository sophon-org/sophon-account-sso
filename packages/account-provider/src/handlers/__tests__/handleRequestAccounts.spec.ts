import type { StorageLike } from '@sophon-labs/account-core';
import type EventEmitter from 'eventemitter3';
import { sophonTestnet } from 'viem/chains';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAccounts, getAccounts, setAccounts } from '../../lib/accounts';
import { handleRequestAccounts } from '../handleRequestAccounts';

describe('Provider > Handlers > handleRequestAccounts', () => {
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

  it('should return resulting account and emit accountsChanged event', async () => {
    // given
    const chainId = sophonTestnet.id;
    const mockEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter;
    const expectedPayload = {
      account: { address: '0x1234567890123456789012345678901234567890' },
    };
    const sender = vi.fn().mockResolvedValueOnce({
      content: {
        result: expectedPayload,
      },
    });
    clearAccounts(mockStorage, chainId);

    // when
    const result = await handleRequestAccounts(
      mockStorage,
      chainId,
      sender,
      mockEmitter,
    );

    // then
    expect(sender).toHaveBeenCalledWith('eth_requestAccounts');
    expect(result).toEqual([expectedPayload.account.address]);
    expect(mockEmitter.emit).toHaveBeenCalledWith('accountsChanged', [
      expectedPayload.account.address,
    ]);
    expect(getAccounts(mockStorage, chainId)).toEqual([
      expectedPayload.account.address,
    ]);
  });

  it('should return cached accounts if available', async () => {
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
    const result = await handleRequestAccounts(
      mockStorage,
      chainId,
      sender,
      mockEmitter,
    );

    // then
    expect(sender).not.toHaveBeenCalled();
    expect(mockEmitter.emit).not.toHaveBeenCalled();
    expect(result).toEqual([account]);
  });

  it('should throw an error if RPC responded with error and not emit accountsChanged event', async () => {
    // given
    const chainId = sophonTestnet.id;
    const errorPayload = { message: 'User Rejected', code: 4001 };
    const sender = vi.fn().mockResolvedValueOnce({
      content: {
        error: errorPayload,
      },
    });
    const mockEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter;
    clearAccounts(mockStorage, chainId);

    // when
    const call = () =>
      handleRequestAccounts(mockStorage, chainId, sender, mockEmitter);

    // then
    await expect(call()).rejects.toThrow(errorPayload.message);
    expect(sender).toHaveBeenCalledWith('eth_requestAccounts');
    expect(mockEmitter.emit).not.toHaveBeenCalled();
    expect(getAccounts(mockStorage, chainId)).toEqual([]);
  });
});

import type EventEmitter from 'eventemitter3';
import { describe, expect, it, vi } from 'vitest';
import { clearAccounts, getAccounts, setAccounts } from '../../lib/accounts';
import { handleRequestAccounts } from '../handleRequestAccounts';

describe('handleRequestAccounts', () => {
  it('should return resulting account and emit accountsChanged event', async () => {
    // given
    const network = 'testnet';
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
    clearAccounts(network);

    // when
    const result = await handleRequestAccounts(network, sender, mockEmitter);

    // then
    expect(sender).toHaveBeenCalledWith('eth_requestAccounts');
    expect(result).toEqual([expectedPayload.account.address]);
    expect(mockEmitter.emit).toHaveBeenCalledWith('accountsChanged', [
      expectedPayload.account.address,
    ]);
    expect(getAccounts(network)).toEqual([expectedPayload.account.address]);
  });

  it('should return cached accounts if available', async () => {
    // given
    const network = 'testnet';
    const account = '0x1234567890123456789012345678901234567890';
    const mockEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter;
    const sender = vi.fn().mockResolvedValueOnce({
      content: {},
    });

    setAccounts(network, [account]);

    // when
    const result = await handleRequestAccounts(network, sender, mockEmitter);

    // then
    expect(sender).not.toHaveBeenCalled();
    expect(mockEmitter.emit).not.toHaveBeenCalled();
    expect(result).toEqual([account]);
  });

  it('should throw an error if RPC responded with error and not emit accountsChanged event', async () => {
    // given
    const network = 'testnet';
    const errorPayload = { message: 'User Rejected' };
    const sender = vi.fn().mockResolvedValueOnce({
      content: {
        error: errorPayload,
      },
    });
    const mockEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter;
    clearAccounts(network);

    // when
    const call = () => handleRequestAccounts(network, sender, mockEmitter);

    // then
    await expect(call()).rejects.toThrow(errorPayload.message);
    expect(sender).toHaveBeenCalledWith('eth_requestAccounts');
    expect(mockEmitter.emit).not.toHaveBeenCalled();
    expect(getAccounts(network)).toEqual([]);
  });
});

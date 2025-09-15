import type EventEmitter from 'eventemitter3';
import { describe, expect, it, vi } from 'vitest';
import { getAccounts, setAccounts } from '../../lib/accounts';
import { handleRevokePermissions } from '../handleRevokePermissions';

describe('handleRevokePermissions', () => {
  it('should return result body if available', async () => {
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
    const result = await handleRevokePermissions(network, sender, mockEmitter);

    // then
    expect(sender).toHaveBeenCalledWith('wallet_revokePermissions');
    expect(result).toEqual([]);
    expect(mockEmitter.emit).toHaveBeenCalledWith('accountsChanged', []);
    expect(getAccounts(network)).toEqual([]);
  });

  it('should just ignore the RPC error, and remove the account from cache', async () => {
    // given
    const network = 'testnet';
    const account = '0x1234567890123456789012345678901234567890';
    const mockEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter;
    const sender = vi.fn().mockRejectedValueOnce(new Error('User Rejected'));
    setAccounts(network, [account]);

    // when
    const call = () => handleRevokePermissions(network, sender, mockEmitter);

    // then
    await expect(call()).resolves.toEqual([]);
    expect(sender).toHaveBeenCalledWith('wallet_revokePermissions');
    expect(mockEmitter.emit).toHaveBeenCalledWith('accountsChanged', []);
    expect(getAccounts(network)).toEqual([]);
  });
});

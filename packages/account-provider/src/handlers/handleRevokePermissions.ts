import type { ChainId, StorageLike } from '@sophon-labs/account-core';
import type EventEmitter from 'eventemitter3';
import { setAccounts } from '../lib/accounts';
import type { RequestSender } from '../types';

interface RequestAccountsResponse {
  account: {
    address: string;
  };
}

/**
 * Handle the wallet_revokePermissions request.
 *
 * @param chainId - The chainId to use.
 * @param sender - The sender to use.
 * @param eventEmitter - The event emitter to use.
 * @returns The accounts available for the user on the given chainId.
 */
export const handleRevokePermissions = async (
  storage: StorageLike,
  chainId: ChainId,
  sender: RequestSender<RequestAccountsResponse>,
  eventEmitter: EventEmitter,
) => {
  const currentAccounts: string[] = [];
  setAccounts(storage, chainId, currentAccounts);

  try {
    // Send logout request to the account server popup
    await sender('wallet_revokePermissions');
  } catch (error) {
    console.warn('Failed to send logout request to account server:', error);
  }

  // Notify listeners about the account change
  eventEmitter.emit('accountsChanged', currentAccounts);

  return currentAccounts;
};

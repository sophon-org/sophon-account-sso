import type { ChainId, StorageLike } from '@sophon-labs/account-core';
import type EventEmitter from 'eventemitter3';
import { setAccounts } from '../lib/accounts';

/**
 * Handle the wallet_disconnect request.
 *
 * @param chainId - The chainId to use.
 * @param eventEmitter - The event emitter to use.
 * @returns The accounts available for the user on the given chainId.
 */
export const handleWalletDisconnect = async (
  storage: StorageLike,
  chainId: ChainId,
  eventEmitter: EventEmitter,
) => {
  const currentAccounts: string[] = [];
  setAccounts(storage, chainId, currentAccounts);

  // Notify listeners about the account change
  eventEmitter.emit('accountsChanged', currentAccounts);

  return currentAccounts;
};

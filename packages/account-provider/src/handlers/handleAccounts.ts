import type { SophonNetworkType, StorageLike } from '@sophon-labs/account-core';
import { getAccounts } from '../lib/accounts';

/**
 * Handle the eth_accounts request. For this request, we don't need to send a request to the account server.
 * We can just return the accounts from the local storage.
 *
 * @param network - The network to use.
 * @param sender - The sender to use.
 * @param eventEmitter - The event emitter to use.
 * @returns The accounts available for the user on the given network.
 */
export const handleAccounts = async (
  storage: StorageLike,
  network: SophonNetworkType,
) => {
  return getAccounts(storage, network);
};

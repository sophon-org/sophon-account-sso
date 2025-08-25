import type { SophonNetworkType } from '@sophon-labs/account-core';
import type EventEmitter from 'eventemitter3';
import { getAccounts, setAccounts } from '../lib/accounts';
import type { RequestSender } from '../types';

interface RequestAccountsResponse {
  account: {
    address: string;
  };
}

/**
 * Handle the eth_requestAccounts request.
 *
 * @param network - The network to use.
 * @param sender - The sender to use.
 * @param eventEmitter - The event emitter to use.
 * @returns The accounts available for the user on the given network.
 */
export const handleRequestAccounts = async (
  network: SophonNetworkType,
  sender: RequestSender<RequestAccountsResponse>,
  eventEmitter: EventEmitter,
) => {
  try {
    // If there are already accounts cached, return them, no need to ask for the
    // account server again
    const accounts = getAccounts(network);
    if (accounts.length > 0) {
      return accounts;
    }

    const response = await sender('eth_requestAccounts');

    if (response?.content?.error) {
      throw new Error(response?.content?.error?.message);
    }
    const address = response?.content?.result?.account?.address;
    const currentAccounts = address ? [address] : [];

    eventEmitter.emit('accountsChanged', currentAccounts);
    setAccounts(network, currentAccounts);

    return currentAccounts;
  } catch (error) {
    console.error('Failed to connect:', error);
    throw error;
  }
};

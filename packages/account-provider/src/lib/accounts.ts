import type { ChainId, StorageLike } from '@sophon-labs/account-core';

const STORAGE_KEY_PREFIX = 'sophon::accounts::';

export const getAccounts = (
  storage: StorageLike,
  chainId: ChainId,
): string[] => {
  const key = `${STORAGE_KEY_PREFIX}${chainId}`;
  const saved = storage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

export const setAccounts = (
  storage: StorageLike,
  chainId: ChainId,
  accounts: string[],
): void => {
  const key = `${STORAGE_KEY_PREFIX}${chainId}`;
  storage.setItem(key, JSON.stringify(accounts));
};

export const clearAccounts = (storage: StorageLike, chainId: ChainId): void => {
  const key = `${STORAGE_KEY_PREFIX}${chainId}`;
  storage.removeItem(key);
};

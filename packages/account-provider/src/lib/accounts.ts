import type { SophonNetworkType, StorageLike } from '@sophon-labs/account-core';

const STORAGE_KEY_PREFIX = 'sophon::accounts::';

export const getAccounts = (
  storage: StorageLike,
  network: SophonNetworkType,
): string[] => {
  const key = `${STORAGE_KEY_PREFIX}${network}`;
  const saved = storage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

export const setAccounts = (
  storage: StorageLike,
  network: SophonNetworkType,
  accounts: string[],
): void => {
  const key = `${STORAGE_KEY_PREFIX}${network}`;
  storage.setItem(key, JSON.stringify(accounts));
};

export const clearAccounts = (
  storage: StorageLike,
  network: SophonNetworkType,
): void => {
  const key = `${STORAGE_KEY_PREFIX}${network}`;
  storage.removeItem(key);
};

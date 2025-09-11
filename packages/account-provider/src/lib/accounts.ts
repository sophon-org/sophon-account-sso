import type { SophonNetworkType } from '@sophon-labs/account-core';

const STORAGE_KEY_PREFIX = 'sophon::accounts::';

export const getAccounts = (network: SophonNetworkType): string[] => {
  const key = `${STORAGE_KEY_PREFIX}${network}`;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

export const setAccounts = (
  network: SophonNetworkType,
  accounts: string[],
): void => {
  const key = `${STORAGE_KEY_PREFIX}${network}`;
  localStorage.setItem(key, JSON.stringify(accounts));
};

export const clearAccounts = (network: SophonNetworkType): void => {
  const key = `${STORAGE_KEY_PREFIX}${network}`;
  localStorage.removeItem(key);
};

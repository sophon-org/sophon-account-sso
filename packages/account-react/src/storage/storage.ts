import type { StorageLike } from '@sophon-labs/account-core';

export const SophonAppStorage: StorageLike = {
  getItem: (key: string) => localStorage.getItem(key) ?? null,
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};

export enum StorageKeys {
  USER_TOKEN = 'sophon::user_token',
  USER_ACCOUNT = 'sophon::user_account',
}

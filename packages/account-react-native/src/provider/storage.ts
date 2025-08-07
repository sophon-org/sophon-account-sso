import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export const SophonAppStorage: StorageLike = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clearAll(),
};

export enum StorageKeys {
  USER_TOKEN = 'user_token',
  USER_ACCOUNT = 'user_account',
}

import * as SecureStore from 'expo-secure-store';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

const normalizeKey = (key: string) => {
  return `sophon-${key.replaceAll(/[^a-zA-Z0-9]/g, '_')}`;
};

export const SophonAppStorage: StorageLike = {
  getItem: (key: string) => {
    const normalizedKey = normalizeKey(key);
    return SecureStore.getItem(normalizedKey);
  },
  setItem: (key: string, value: string) => {
    const normalizedKey = normalizeKey(key);
    SecureStore.setItem(normalizedKey, value);
  },
  removeItem: (key: string) => {
    const normalizedKey = normalizeKey(key);
    SecureStore.deleteItemAsync(normalizedKey);
  },
  clear: () => {
    Object.values(StorageKeys).forEach((entry) => {
      const normalizedKey = normalizeKey(entry);
      SecureStore.setItem(normalizedKey, '');
      SecureStore.deleteItemAsync(normalizedKey);
    });
  },
};

export enum StorageKeys {
  USER_ACCESS_TOKEN = 'sophon-user-access-token',
  USER_ACCOUNT = 'sophon-user-account',
  USER_REFRESH_TOKEN = 'sophon-user-refresh-token',
}

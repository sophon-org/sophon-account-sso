import * as SecureStore from 'expo-secure-store';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export const SophonAppStorage: StorageLike = {
  getItem: (key: string) => {
    const normalizedKey = `sophon-${key.replaceAll(/[^a-zA-Z0-9]/g, '_')}`;
    return SecureStore.getItem(normalizedKey);
  },
  setItem: (key: string, value: string) => {
    const normalizedKey = `sophon-${key.replaceAll(/[^a-zA-Z0-9]/g, '_')}`;
    SecureStore.setItem(normalizedKey, value);
  },
  removeItem: (key: string) => {
    const normalizedKey = `sophon-${key.replaceAll(/[^a-zA-Z0-9]/g, '_')}`;
    SecureStore.deleteItemAsync(normalizedKey);
  },
  clear: () => {
    SecureStore.deleteItemAsync(StorageKeys.USER_TOKEN);
    SecureStore.deleteItemAsync(StorageKeys.USER_ACCOUNT);
  },
};

export enum StorageKeys {
  USER_TOKEN = 'sophon-user-token',
  USER_ACCOUNT = 'sophon-user-account',
  USER_REFRESH_TOKEN = 'sophon-user-refresh-token',
}

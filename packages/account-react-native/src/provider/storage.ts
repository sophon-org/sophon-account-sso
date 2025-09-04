// import * as SecureStore from 'expo-secure-store';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export const SophonAppStorage: StorageLike = {
  getItem: (key: string) => {
    return '';
    // console.log('getItem', key);
    // return SecureStore.getItem(key);
  },
  setItem: (key: string, value: string) => {
    console.log('setItem', key, value);
    // SecureStore.setItem(key, value);
  },
  removeItem: (key: string) => {
    console.log('removeItem', key);
    // SecureStore.deleteItemAsync(key);
  },
  clear: () => {
    console.log('clear');
    // SecureStore.deleteItemAsync(StorageKeys.USER_TOKEN);
    // SecureStore.deleteItemAsync(StorageKeys.USER_ACCOUNT);
  },
};

export enum StorageKeys {
  USER_TOKEN = 'sophon-user-token',
  USER_ACCOUNT = 'sophon-user-account',
}

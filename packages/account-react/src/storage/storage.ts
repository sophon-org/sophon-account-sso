interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export const SophonAppStorage: StorageLike = {
  getItem: (key: string) => localStorage.getString(key) ?? null,
  setItem: (key: string, value: string) => localStorage.set(key, value),
  removeItem: (key: string) => localStorage.delete(key),
  clear: () => localStorage.clearAll(),
};

export enum StorageKeys {
  USER_TOKEN = 'user_token',
  USER_ACCOUNT = 'user_account',
}

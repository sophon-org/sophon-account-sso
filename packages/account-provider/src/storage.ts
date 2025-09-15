import type { StorageLike } from '@sophon-labs/account-core';

/**
 * to be used as default when no storage is provided and we cannot use localStorage (like in ssr environments etc..)
 */
export const NoopStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

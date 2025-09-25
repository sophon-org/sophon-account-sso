import { env } from '@/env';
import { LOCAL_STORAGE_KEY } from '@/lib/constants';
import { serverLog } from '@/lib/server-log';

export const logWithUser = (message: string) => {
  if (!env.NEXT_PUBLIC_SERVER_LOGS_ENABLED) return;

  try {
    let accountAddress = 'unknown';
    if (typeof localStorage !== 'undefined' && typeof window !== 'undefined') {
      const account = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (account) {
        const accountData = JSON.parse(account);
        accountAddress = accountData.address;
      }
    }
    serverLog(`🔎 ${accountAddress}: ${message}`);
  } catch {}
};

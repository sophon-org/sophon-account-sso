'use server';

import { env } from '@/env';

export async function serverLog(message: string) {
  if (env.NEXT_PUBLIC_SERVER_LOGS_ENABLED) {
    console.log('🔥 Remote Log:', message);
  }
}

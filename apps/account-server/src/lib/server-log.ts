'use server';

const LOG_ENABLED = false;

export async function serverLog(message: string) {
  if (LOG_ENABLED) {
    console.log('🔥 Remote Log:', message);
  }
}

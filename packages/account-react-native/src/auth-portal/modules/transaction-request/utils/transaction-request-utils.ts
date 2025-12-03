import { shortenAddress } from '@sophon-labs/account-core';
import type {
  DecodedArgsContractTransaction,
  TransactionCurrentRequest,
} from '../../../../types/transaction-request';

// Constants
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Types
export interface EnrichmentError {
  message: string;
  code: string;
  retry?: boolean;
}

// Helper functions
export function validateTransactionRequest(
  request: TransactionCurrentRequest | null | undefined,
): request is TransactionCurrentRequest {
  if (!request) return false;
  if (!request.to) return false;
  if (!request.from) return false;
  if (!request.data) return false;
  return true;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, API_TIMEOUT);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Request aborted'));
      });
    }

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export function handleEnrichmentError(error: unknown): EnrichmentError {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT_ERROR',
        retry: true,
      };
    }
    if (error.message.includes('aborted')) {
      return {
        message: 'Request was cancelled.',
        code: 'ABORT_ERROR',
        retry: false,
      };
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        retry: true,
      };
    }
  }
  return {
    message: 'Failed to process transaction. Please try again.',
    code: 'UNKNOWN_ERROR',
    retry: true,
  };
}

export function truncateContractName(text: string) {
  const name = text.replace(/.*\.(sol|vy):/, '');
  return name;
}

export function formatDecodeArgsValue(item: DecodedArgsContractTransaction) {
  if (item.type === 'address')
    return shortenAddress(item?.value as `0x{string}`);

  if (item.type === 'tuple') {
    try {
      const data = JSON.parse(item.value) as Record<string, string>;
      return Object.entries(data).map(([name, value]) => ({ name, value }));
    } catch {}
  }

  return item?.value;
}

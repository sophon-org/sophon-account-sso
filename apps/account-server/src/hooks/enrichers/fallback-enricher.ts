import { formatEther } from 'viem';
import type {
  EnrichedUnknownTransaction,
  TransactionRequest,
} from '@/types/auth';
import { TransactionType } from '@/types/auth';

export const enrichFallbackTransaction = async (
  transactionRequest: TransactionRequest,
  fee?: { SOPH: string; USD?: string },
): Promise<EnrichedUnknownTransaction> => {
  // Fallback to basic transaction data
  return {
    ...transactionRequest,
    transactionType: TransactionType.UNKNOWN,
    recipient: transactionRequest.to,
    displayValue: formatEther(BigInt(transactionRequest.value || '0')),
    paymaster: transactionRequest.paymaster,
    paymasterInput: transactionRequest.paymasterInput,
    fee,
  };
};

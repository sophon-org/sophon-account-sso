import { formatEther } from 'viem';
import {
  type EnrichedUnknownTransaction,
  type TransactionCurrentRequest,
  TransactionType,
} from '../types/transaction-request';

export const enrichFallbackTransaction = async (
  transactionRequest: TransactionCurrentRequest,
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

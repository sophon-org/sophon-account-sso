import { formatEther } from 'viem';
import type {
  EnrichedSOPHTransaction,
  TokenInfo,
  TransactionCurrentRequest,
} from '../types/transaction-request';
import { TransactionType } from '../types/transaction-request';

export const enrichSOPHTransaction = async (
  transactionRequest: TransactionCurrentRequest,
  sophTokenDetails: TokenInfo,
  fee?: { SOPH: string; USD?: string },
): Promise<EnrichedSOPHTransaction> => {
  return {
    ...transactionRequest,
    transactionType: TransactionType.SOPH,
    recipient: transactionRequest.to,
    token: sophTokenDetails,
    displayValue: formatEther(BigInt(transactionRequest.value || '0')),
    fee,
  };
};

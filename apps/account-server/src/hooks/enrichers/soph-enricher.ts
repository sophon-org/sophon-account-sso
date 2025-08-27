import { formatEther } from 'viem';
import type { EnrichedSOPHTransaction, TransactionRequest } from '@/types/auth';
import { type Token, TransactionType } from '@/types/auth';

export const enrichSOPHTransaction = async (
  transactionRequest: TransactionRequest,
  sophTokenDetails: Token,
  fee?: { SOPH: string; USD?: string },
): Promise<EnrichedSOPHTransaction> => {
  return {
    ...transactionRequest,
    transactionType: TransactionType.SOPH,
    recipient: transactionRequest.to,
    token: sophTokenDetails,
    displayValue: formatEther(BigInt(transactionRequest.value || '0')),
    paymaster: transactionRequest.paymaster,
    paymasterInput: transactionRequest.paymasterInput,
    fee,
  };
};

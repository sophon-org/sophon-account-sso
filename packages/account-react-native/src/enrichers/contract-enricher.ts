import type { ExplorerContractInfo } from '@sophon-labs/account-core';
import { formatEther } from 'viem';
import {
  type EnrichedContractTransaction,
  type TransactionCurrentRequest,
  TransactionType,
} from '../types/transaction-request';
import type { DecodedTransactionData } from './enrichment-utils';

export const enrichContractTransaction = async (
  transactionRequest: TransactionCurrentRequest,
  contractInfo: ExplorerContractInfo,
  decodedData?: DecodedTransactionData,
  fee?: { SOPH: string; USD?: string },
): Promise<EnrichedContractTransaction> => {
  return {
    ...transactionRequest,
    transactionType: TransactionType.CONTRACT,
    recipient: transactionRequest.to,
    displayValue: formatEther(BigInt(transactionRequest.value || '0')),
    paymaster: transactionRequest.paymaster,
    paymasterInput: transactionRequest.paymasterInput,
    decodedData: decodedData || undefined,
    contractName: contractInfo.name || undefined,
    isVerified: contractInfo.isVerified,
    fee,
  };
};

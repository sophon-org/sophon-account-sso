import type { ExplorerContractInfo } from '@sophon-labs/account-core';
import { formatEther, formatUnits } from 'viem';
import {
  type DecodedTransactionData,
  type EnrichedApprovalTransaction,
  type TokenInfo,
  type TransactionCurrentRequest,
  TransactionType,
} from '../types/transaction-request';

export const enrichApprovalTransaction = async (
  transactionRequest: TransactionCurrentRequest,
  token: TokenInfo,
  decodedData: DecodedTransactionData,
  spenderContractInfo: ExplorerContractInfo,
  currentBalance: string | null,
  fee?: { SOPH: string; USD?: string },
): Promise<EnrichedApprovalTransaction> => {
  const spenderAddress = decodedData?.args[0]?.value?.toString();
  const spenderName = spenderContractInfo.name;

  return {
    ...transactionRequest,
    transactionType: TransactionType.APPROVE,
    recipient: transactionRequest.to,
    token: {
      ...token,
      currentBalance: formatUnits(
        BigInt(currentBalance || '0'),
        Number(token.tokenDecimal),
      ),
    },
    displayValue: formatEther(BigInt(transactionRequest.value || '0')),
    spender: {
      name: spenderName || 'Unknown',
      address: spenderAddress as string,
      spendingCap: formatEther(
        BigInt(decodedData?.args[1]?.value?.toString() || '0'),
      ),
    },
    fee,
  };
};

import { formatEther } from 'viem';
import type {
  EnrichedContractTransaction,
  TransactionRequest,
} from '@/types/auth';
import { type ContractInfo, TransactionType } from '@/types/auth';

export const enrichContractTransaction = async (
  transactionRequest: TransactionRequest,
  contractInfo: ContractInfo,
  decodedData?: {
    functionName: string;
    args: Array<{ name: string; value: string; type: string }>;
  },
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

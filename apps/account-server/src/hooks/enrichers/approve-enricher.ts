import { formatEther, formatUnits } from 'viem';
import type {
  EnrichedApprovalTransaction,
  TransactionRequest,
} from '@/types/auth';
import { type ContractInfo, type Token, TransactionType } from '@/types/auth';

export const enrichApprovalTransaction = async (
  transactionRequest: TransactionRequest,
  token: Token,
  decodedData: { args: Array<{ name: string; value: string; type: string }> },
  spenderContractInfo: ContractInfo,
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
      address: spenderAddress,
      spendingCap: formatEther(
        BigInt(decodedData?.args[1]?.value?.toString() || '0'),
      ),
    },
    fee,
  };
};

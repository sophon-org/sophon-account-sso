import { decodeFunctionData, erc20Abi, formatUnits } from 'viem';
import type {
  EnrichedERC20Transaction,
  TransactionRequest,
} from '@/types/auth';
import { type Token, TransactionType } from '@/types/auth';

export const enrichERC20Transaction = async (
  transactionRequest: TransactionRequest,
  token: Token,
  fee?: { SOPH: string; USD?: string },
): Promise<EnrichedERC20Transaction> => {
  // ERC20 transfer
  const decodedData = decodeFunctionData({
    abi: erc20Abi,
    data: transactionRequest.data as `0x${string}`,
  });

  return {
    ...transactionRequest,
    transactionType: TransactionType.ERC20,
    recipient: decodedData.args[0]?.toString() || '',
    token,
    displayValue: formatUnits(
      BigInt(decodedData.args[1]?.toString() || '0'),
      18,
    ),
    paymaster: transactionRequest.paymaster,
    paymasterInput: transactionRequest.paymasterInput,
    fee,
  };
};

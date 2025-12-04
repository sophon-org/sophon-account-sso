import { decodeFunctionData, erc20Abi, formatUnits } from 'viem';

import {
  type EnrichedERC20Transaction,
  type TokenInfo,
  type TransactionCurrentRequest,
  TransactionType,
} from '../types/transaction-request';

export const enrichERC20Transaction = async (
  transactionRequest: TransactionCurrentRequest,
  token: TokenInfo,
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
    recipient: (decodedData.args[0]?.toString() || '') as `0x${string}`,
    token,
    displayValue: formatUnits(
      BigInt(decodedData.args[1]?.toString() || '0'),
      Number(token.tokenDecimal),
    ),
    paymaster: transactionRequest.paymaster,
    paymasterInput: transactionRequest.paymasterInput,
    fee,
  };
};

import { useEffect, useState } from 'react';
import { decodeFunctionData, erc20Abi, formatEther, formatUnits } from 'viem';
import { BLOCK_EXPLORER_API_URL } from '@/lib/constants';
import {
  type ContractInfo,
  type EnrichedTransactionRequest,
  type TransactionRequest,
  TransactionType,
} from '@/types/auth';
import { useEstimateFee } from './useEstimateFee';

const getTokenFromAddress = async (address: string) => {
  try {
    const response = await fetch(
      `${BLOCK_EXPLORER_API_URL}/api?module=token&action=tokeninfo&contractaddress=${address}`,
    );
    const data = await response.json();
    return data.result[0];
  } catch (error) {
    console.warn('Failed to fetch token info:', error);
    return null;
  }
};

const getContractInfo = async (address: string): Promise<ContractInfo> => {
  try {
    const response = await fetch(
      `${BLOCK_EXPLORER_API_URL}/api?module=contract&action=getsourcecode&address=${address}`,
    );

    const data = await response.json();

    if (
      data.status === '1' &&
      data.result &&
      data.result !== 'Contract source code not verified'
    ) {
      return {
        abi: JSON.parse(data.result[0].ABI),
        name: data.result[0].ContractName,
      };
    }
    return {
      abi: null,
      name: null,
    };
  } catch (error) {
    console.warn('Failed to fetch contract ABI:', error);
    return {
      abi: null,
      name: null,
    };
  }
};

const getFunctionParameters = (
  decodedData: { functionName: string; args: readonly unknown[] },
  contractInfo: ContractInfo,
): {
  functionName: string;
  args: Array<{ name: string; value: string; type: string }>;
} | null => {
  if (!contractInfo.abi) return null;

  const functionAbi = contractInfo.abi.find(
    (item) =>
      item.type === 'function' &&
      item.name === decodedData.functionName &&
      item.inputs?.length === decodedData.args.length,
  );

  if (functionAbi?.inputs) {
    const parameters = decodedData.args.map((arg: unknown, index: number) => ({
      name: functionAbi.inputs?.[index]?.name || `param${index}`,
      value: arg?.toString() || '',
      type: functionAbi.inputs?.[index]?.type || 'unknown',
    }));

    return {
      functionName: decodedData.functionName,
      args: parameters,
    };
  }

  return null;
};

export const useEnrichTransactionRequest = (
  transactionRequest: TransactionRequest | null | undefined,
) => {
  const [enrichedTransactionRequest, setEnrichedTransactionRequest] =
    useState<EnrichedTransactionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { estimateFee, isEstimating } = useEstimateFee();

  useEffect(() => {
    if (!transactionRequest) {
      setEnrichedTransactionRequest(null);
      return;
    }

    const enrichTransaction = async () => {
      setIsLoading(true);

      let fee: string | undefined;

      if (
        !transactionRequest.paymaster ||
        transactionRequest.paymaster === '0x'
      ) {
        fee = formatEther((await estimateFee()) || BigInt(0)).slice(0, 8);
      }

      try {
        // If the data is 0x, it's a SOPH transfer
        const isSophTransfer = transactionRequest.data === '0x';
        const token = isSophTransfer
          ? await getTokenFromAddress(
              '0x000000000000000000000000000000000000800A',
            )
          : await getTokenFromAddress(transactionRequest.to);

        if (isSophTransfer) {
          setEnrichedTransactionRequest({
            ...transactionRequest,
            transactionType: TransactionType.SOPH,
            recipient: transactionRequest.to,
            token,
            displayValue: formatEther(BigInt(transactionRequest.value || '0')),
            paymaster: transactionRequest.paymaster,
            paymasterInput: transactionRequest.paymasterInput,
            fee,
          });
        } else {
          const [token, contractInfo] = await Promise.all([
            getTokenFromAddress(transactionRequest.to),
            getContractInfo(transactionRequest.to),
          ]);

          let decodedData = null;

          if (contractInfo.abi) {
            try {
              const rawDecodedData = decodeFunctionData({
                abi: contractInfo.abi,
                data: transactionRequest.data as `0x${string}`,
              });

              if (rawDecodedData.args) {
                decodedData = getFunctionParameters(
                  {
                    functionName: rawDecodedData.functionName,
                    args: rawDecodedData.args,
                  },
                  contractInfo,
                );
              }
            } catch (_error) {
              decodedData = null;
            }
          }

          if (token && !decodedData) {
            // ERC20 transfer
            const decodedData = decodeFunctionData({
              abi: erc20Abi,
              data: transactionRequest.data as `0x${string}`,
            });
            setEnrichedTransactionRequest({
              ...transactionRequest,
              transactionType: TransactionType.ERC20,
              recipient: decodedData.args[0]?.toString(),
              token,
              displayValue: formatUnits(
                BigInt(decodedData.args[1]?.toString() || '0'),
                18,
              ),
              paymaster: transactionRequest.paymaster,
              paymasterInput: transactionRequest.paymasterInput,
              fee,
            });
          } else {
            // Contract interaction
            setEnrichedTransactionRequest({
              ...transactionRequest,
              transactionType: TransactionType.CONTRACT,
              recipient: transactionRequest.to,
              displayValue: formatEther(
                BigInt(transactionRequest.value || '0'),
              ),
              paymaster: transactionRequest.paymaster,
              paymasterInput: transactionRequest.paymasterInput,
              decodedData: decodedData || undefined,
              contractName: contractInfo.name || undefined,
              fee,
            });
          }
        }
      } catch (error) {
        console.error('Failed to enrich transaction:', error);
        // Fallback to basic transaction data
        setEnrichedTransactionRequest({
          ...transactionRequest,
          transactionType: TransactionType.UNKNOWN,
          recipient: transactionRequest.to,
          displayValue: formatEther(BigInt(transactionRequest.value || '0')),
          paymaster: transactionRequest.paymaster,
          paymasterInput: transactionRequest.paymasterInput,
          fee,
        });
      } finally {
        setIsLoading(false);
      }
    };

    enrichTransaction();
  }, [transactionRequest, estimateFee]);

  return { enrichedTransactionRequest, isLoading, isEstimating };
};

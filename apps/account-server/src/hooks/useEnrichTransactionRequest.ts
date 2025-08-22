import { useEffect, useState } from 'react';
import { decodeFunctionData, formatEther, formatUnits, parseAbi } from 'viem';
import { BLOCK_EXPLORER_API_URL } from '@/lib/constants';
import {
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

const getContractABI = async (address: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BLOCK_EXPLORER_API_URL}/api?module=contract&action=getabi&address=${address}`,
    );
    const data = await response.json();

    if (
      data.status === '1' &&
      data.result &&
      data.result !== 'Contract source code not verified'
    ) {
      return data.result;
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch contract ABI:', error);
    return null;
  }
};

// Function to decode any function call with the actual ABI
const decodeWithABI = (abi: string, data: string) => {
  try {
    // Parse the JSON string from blockchain explorer API
    const abiArray = JSON.parse(abi);

    // Filter only functions (exclude events, errors, etc.)

    const functionAbi = abiArray.filter(
      // biome-ignore lint/suspicious/noExplicitAny: review that in the future TODO
      (item: any) => item.type === 'function',
    );

    // Convert ABI objects to function signature strings that viem can parse
    // biome-ignore lint/suspicious/noExplicitAny: review that in the future TODO
    const functionSignatures = functionAbi.map((func: any) => {
      const inputs =
        func.inputs
          // biome-ignore lint/suspicious/noExplicitAny: review that in the future TODO
          ?.map((input: any) => {
            const name = input.name || `param${input.internalType}`;
            return `${input.type} ${name}`;
          })
          .join(', ') || '';
      return `function ${func.name}(${inputs})`;
    });

    const parsedABI = parseAbi(functionSignatures);

    const decodedData = decodeFunctionData({
      abi: functionAbi,
      data: data as `0x${string}`,
    });

    if (!decodedData.args) {
      return null;
    }

    const result = {
      functionName: decodedData.functionName,
      functionSignature: functionSignatures[0],
      parameters: decodedData.args.map((arg, index) => ({
        name:
          decodedData.functionName === 'mint' && index === 0
            ? '_destinationAddress'
            : decodedData.functionName === 'mint' && index === 1
              ? '_quantity'
              : `param${index}`,
        value: arg?.toString() || '',
        type:
          typeof arg === 'bigint'
            ? 'uint256'
            : typeof arg === 'string'
              ? 'address'
              : 'unknown',
      })),
    };

    return result;
  } catch (error) {
    console.error('Failed to decode with ABI:', error);
    return null;
  }
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

      try {
        // If the data is 0x, it's a SOPH transfer
        const isSophTransfer = transactionRequest.data === '0x';
        const token = isSophTransfer
          ? await getTokenFromAddress(
              '0x000000000000000000000000000000000000800A',
            )
          : await getTokenFromAddress(transactionRequest.to);

        const contractABI = await getContractABI(transactionRequest.to);

        if (isSophTransfer) {
          const fee = await estimateFee();
          setEnrichedTransactionRequest({
            ...transactionRequest,
            transactionType: TransactionType.SOPH,
            recipient: transactionRequest.to,
            token,
            displayValue: formatEther(BigInt(transactionRequest.value || '0')),
            usePaymaster: false,
            fee: formatEther(fee || BigInt(0)).slice(0, 8),
          });
        } else {
          if (token) {
            // If its not SOPH transfer and we have a token, we can decode the data as ERC20
            const decodedData = decodeFunctionData({
              abi: JSON.parse(contractABI!),
              data: transactionRequest.data as `0x${string}`,
            });
            setEnrichedTransactionRequest({
              ...transactionRequest,
              transactionType: TransactionType.ERC20,
              recipient: decodedData?.args?.[0]?.toString(),
              token,
              displayValue: formatUnits(
                BigInt(decodedData?.args?.[1]?.toString() || '0'),
                18,
              ),
              usePaymaster: true,
            });
          } else {
            // Not an ERC20 transfer, try to get the actual contract ABI

            let decodedData = null;

            if (contractABI) {
              decodedData = decodeWithABI(
                JSON.stringify(contractABI),
                transactionRequest.data || '',
              );
            }

            // If we still don't have interaction details, create a fallback
            if (!decodedData) {
              const functionSignature = transactionRequest.data?.slice(0, 10);
              decodedData = {
                functionName: 'unknown',
                functionSignature: functionSignature || 'unknown',
                parameters: [],
              };
            }

            // Set enriched transaction request for contract interactions
            setEnrichedTransactionRequest({
              ...transactionRequest,
              transactionType: TransactionType.CONTRACT,
              recipient: transactionRequest.to,
              displayValue: formatEther(
                BigInt(transactionRequest.value || '0'),
              ),
              usePaymaster: true,
              decodedData,
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
          usePaymaster: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    enrichTransaction();
  }, [transactionRequest, estimateFee]);

  return { enrichedTransactionRequest, isLoading, isEstimating };
};

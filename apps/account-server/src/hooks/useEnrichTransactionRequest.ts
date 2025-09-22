import { useEffect, useState } from 'react';
import { decodeFunctionData, formatEther } from 'viem';
import type {
  EnrichedTransactionRequest,
  TransactionRequest,
} from '@/types/auth';
import { ERC20FunctionName } from '@/types/auth';
import {
  enrichApprovalTransaction,
  enrichContractTransaction,
  enrichERC20Transaction,
  enrichFallbackTransaction,
  enrichSOPHTransaction,
  getContractInfo,
  getFunctionParameters,
  getOpenChainSignature,
  getTokenBalance,
  getTokenFromAddress,
} from './enrichers';
import { useEstimateFee } from './useEstimateFee';

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

      let fee: { SOPH: string; USD?: string } | undefined;

      const sophTokenDetails = await getTokenFromAddress(
        '0x000000000000000000000000000000000000800A',
      );

      if (
        !transactionRequest.paymaster ||
        transactionRequest.paymaster === '0x'
      ) {
        const feeSOPH = formatEther(
          (await estimateFee({
            to: transactionRequest.to,
            data: transactionRequest.data,
            value: transactionRequest.value,
          })) || BigInt(0),
        ).slice(0, 8);
        fee = {
          SOPH: feeSOPH,
          USD:
            sophTokenDetails &&
            !Number.isNaN(Number(sophTokenDetails?.tokenPriceUSD))
              ? (
                  Number(feeSOPH) * Number(sophTokenDetails?.tokenPriceUSD)
                ).toFixed(3)
              : undefined,
        };
      }

      try {
        // If the data is 0x, it's a SOPH transfer
        const isSophTransfer = transactionRequest.data === '0x';

        if (isSophTransfer) {
          const enrichedTransaction = await enrichSOPHTransaction(
            transactionRequest,
            sophTokenDetails,
            fee,
          );
          setEnrichedTransactionRequest(enrichedTransaction);
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
          } else if (!contractInfo.isVerified) {
            try {
              // If contract is not verified, try to get the function signature from OpenChain
              const signatureData = await getOpenChainSignature(
                transactionRequest.data || '',
              );
              if (signatureData) {
                decodedData = {
                  functionName: signatureData.functionName,
                  args: signatureData.args,
                };
              }
            } catch (_error) {
              // Silently fail, decodedData remains null
            }
          }

          if (
            token &&
            (!decodedData ||
              decodedData?.functionName === ERC20FunctionName.TRANSFER)
          ) {
            // ERC20 transfer
            const enrichedTransaction = await enrichERC20Transaction(
              transactionRequest,
              token,
              fee,
            );
            setEnrichedTransactionRequest(enrichedTransaction);
          } else if (
            token &&
            decodedData &&
            decodedData?.functionName === ERC20FunctionName.APPROVE
          ) {
            // ERC20 approve
            const spenderAddress = decodedData?.args[0]?.value?.toString();
            const spenderContractInfo = await getContractInfo(spenderAddress);
            const currentBalance = await getTokenBalance(
              transactionRequest.from,
              token?.contractAddress || '',
            );

            const enrichedTransaction = await enrichApprovalTransaction(
              transactionRequest,
              token,
              decodedData,
              spenderContractInfo,
              currentBalance,
              fee,
            );
            setEnrichedTransactionRequest(enrichedTransaction);
          } else {
            // Contract interaction
            const enrichedTransaction = await enrichContractTransaction(
              transactionRequest,
              contractInfo,
              decodedData || undefined,
              fee,
            );
            setEnrichedTransactionRequest(enrichedTransaction);
          }
        }
      } catch (error) {
        console.error('Failed to enrich transaction:', error);
        // Fallback to basic transaction data
        const fallbackTransaction = await enrichFallbackTransaction(
          transactionRequest,
          fee,
        );
        setEnrichedTransactionRequest(fallbackTransaction);
      } finally {
        setIsLoading(false);
      }
    };

    enrichTransaction();
  }, [transactionRequest, estimateFee]);

  return { enrichedTransactionRequest, isLoading, isEstimating };
};

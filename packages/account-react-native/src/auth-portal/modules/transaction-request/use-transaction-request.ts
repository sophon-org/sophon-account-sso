import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import { enrichFallbackTransaction } from '../../../enrichers';
import { useERC20Approval, useFlowManager } from '../../../hooks';
import type {
  ContentCurrentRequest,
  EnrichedTransactionRequest,
  TransactionCurrentRequest,
} from '../../../types/transaction-request';
import {
  type EnrichmentError,
  handleEnrichmentError,
} from './utils/transaction-request-utils';
import { useTransactionUtils } from './utils/use-transaction-utils';

export function useTransactionRequest() {
  const { currentRequest } = useFlowManager();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<EnrichmentError | null>(null);

  const transactionRequest = useMemo(() => {
    const content = currentRequest?.content as ContentCurrentRequest;
    if (!content?.action?.params) return null;

    const [firstParam] = content.action.params;
    return firstParam as TransactionCurrentRequest;
  }, [currentRequest]);

  const {
    getTokenFromAddress,
    calculateFee,
    enrichSOPHTransfer,
    enrichNonSOPHTransaction,
    getTokenBalance,
    openExplorerAddress,
  } = useTransactionUtils(transactionRequest);

  const { isLoading: isERC20ApprovalLoading } = useERC20Approval({
    tokenAddress: transactionRequest?.to as Address,
    spender: transactionRequest?.from as Address,
    amount: BigInt(transactionRequest?.value ?? '0'),
  });

  const isSophonTransaction = useMemo(() => {
    if (!transactionRequest) return false;
    return transactionRequest?.data === '0x';
  }, [transactionRequest]);

  const [loading, setIsLoading] = useState(true);

  const [enrichedTransactionRequest, setEnrichedTransactionRequest] =
    useState<EnrichedTransactionRequest | null>(null);

  useEffect(() => {
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!transactionRequest) {
      setEnrichedTransactionRequest(null);
      setError(null);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const { signal } = abortController;

    const enrichTransaction = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const sophTokenDetails = await getTokenFromAddress(undefined, signal);

        const fee = await calculateFee(sophTokenDetails, signal);

        const isSophTransfer = transactionRequest?.data === '0x';

        if (isSophTransfer) {
          const enrichedTransaction = await enrichSOPHTransfer(
            transactionRequest,
            sophTokenDetails,
            fee,
          );
          setEnrichedTransactionRequest(enrichedTransaction);
        } else {
          const enrichedTransaction = await enrichNonSOPHTransaction(
            transactionRequest,
            sophTokenDetails,
            fee,
            signal,
          );
          setEnrichedTransactionRequest(enrichedTransaction);
        }
      } catch (err) {
        console.error('Error enriching transaction request:', err);
        if (signal.aborted) {
          return;
        }

        const enrichmentError = handleEnrichmentError(err);
        setError(enrichmentError);

        try {
          const fallbackTransaction = await enrichFallbackTransaction(
            transactionRequest,
            undefined,
          );
          setEnrichedTransactionRequest(fallbackTransaction);
        } catch (fallbackErr) {
          console.error('Failed to create fallback transaction:', fallbackErr);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    enrichTransaction();

    return () => {
      abortController.abort();
    };
  }, [
    transactionRequest,

    getTokenFromAddress,
    calculateFee,
    enrichSOPHTransfer,
    enrichNonSOPHTransaction,
  ]);

  const retryEnrichment = useCallback(() => {
    // Trigger re-enrichment by updating a dependency
    setError(null);
    setEnrichedTransactionRequest(null);
  }, []);

  return {
    isSophonTransaction,
    enrichedTransactionRequest,
    loading: isERC20ApprovalLoading || loading,
    transactionRequest,
    error,
    retryEnrichment,
    getTokenBalance,
    getTokenFromAddress,
    openExplorerAddress,
  };
}

export type UseTransactionRequestHook = ReturnType<
  typeof useTransactionRequest
>;

import { useEffect } from 'react';
import { IconSignature } from '@/components/icons/icon-signature';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useEnrichTransactionRequest } from '@/hooks/useEnrichTransactionRequest';
import { useTransaction } from '@/hooks/useTransaction';
import {
  trackDialogInteraction,
  trackTransactionRequest,
  trackTransactionResult,
} from '@/lib/analytics';
import { windowService } from '@/service/window.service';
import { TransactionType } from '@/types/auth';

export default function TransactionRequestView() {
  const { incoming: incomingRequest, transaction: transactionRequest } =
    MainStateMachineContext.useSelector((state) => state.context.requests);
  const actorRef = MainStateMachineContext.useActorRef();
  const { enrichedTransactionRequest, isLoading, isEstimating } =
    useEnrichTransactionRequest(transactionRequest);
  const { isSending, sendTransaction, transactionError } = useTransaction();
  console.log(enrichedTransactionRequest);
  // Track transaction request received
  useEffect(() => {
    if (transactionRequest) {
      trackTransactionRequest(windowService.name, transactionRequest.value);
    }
  }, [transactionRequest]);

  if (!transactionRequest || !incomingRequest) {
    return <div>No transaction request present</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 px-6">
      <VerificationImage icon={<IconSignature className="w-24 h-24" />} />
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Transaction request</h5>
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>
      <MessageContainer>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 w-full h-full">
            <Loader className="w-8 h-8 border-white border-r-transparent" />
          </div>
        ) : enrichedTransactionRequest?.transactionType ===
          TransactionType.SOPH ? (
          // SOPH transaction display
          <div className="text-sm text-black flex flex-col gap-1">
            <p className="text-xs font-bold">From:</p>
            <p className="text-sm text-black font-mono break-all">
              {enrichedTransactionRequest?.from}
            </p>
            <p className="text-xs font-bold">To:</p>
            <p className="text-sm font-mono break-all text-black">
              {enrichedTransactionRequest?.recipient}
            </p>
            <p className="text-xs font-bold">Token:</p>
            <p className="text-sm text-black">
              {enrichedTransactionRequest?.token?.symbol}
            </p>
            <p className="text-xs font-bold">Amount:</p>
            <p className="text-sm text-black">
              {enrichedTransactionRequest?.displayValue}
            </p>
          </div>
        ) : enrichedTransactionRequest?.transactionType ===
          TransactionType.ERC20 ? (
          // ERC20 transaction display
          <div className="text-sm text-black flex flex-col gap-1">
            <p className="text-xs font-bold">From:</p>
            <p className="text-sm text-black font-mono break-all">
              {enrichedTransactionRequest?.from}
            </p>
            <p className="text-xs font-bold">To:</p>
            <p className="text-sm font-mono break-all text-black">
              {enrichedTransactionRequest?.recipient}
            </p>
            <p className="text-xs font-bold">Token:</p>
            <p className="text-sm text-black">
              {enrichedTransactionRequest?.token?.symbol}
            </p>
            <p className="text-xs font-bold">Amount:</p>
            <p className="text-sm text-black">
              {enrichedTransactionRequest?.displayValue}
            </p>
          </div>
        ) : enrichedTransactionRequest?.transactionType ===
          TransactionType.CONTRACT ? (
          // Contract transaction display
          // Contract transaction display
          <div className="text-sm text-black flex flex-col gap-3">
            <div className="text-left">
              <p className="text-sm font-bold">Interacting with</p>
              <p className="text-sm text-black">
                Sophon Guardian NFT @{' '}
                {enrichedTransactionRequest?.recipient?.slice(0, 6)}...
                {enrichedTransactionRequest?.recipient?.slice(-6)}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold">
                Executing "
                {enrichedTransactionRequest?.decodedData?.functionName ||
                  'Unknown'}
                " with parameters
              </p>
              {enrichedTransactionRequest?.decodedData?.parameters?.map(
                (param) => (
                  <div key={param.name} className="text-sm text-black">
                    <span className="font-mono">{param.name}:</span>{' '}
                    {param.value}
                  </div>
                ),
              )}
            </div>

            <div className="text-left">
              <p className="text-sm text-black">
                You are sending {enrichedTransactionRequest?.displayValue} SOPH
                for this transaction to the contract above.
              </p>
            </div>
          </div>
        ) : (
          // Default case for unknown transaction types
          <div className="text-sm text-black">
            <p>Unknown transaction type</p>
          </div>
        )}
      </MessageContainer>

      <div className="w-full flex justify-between">
        <p className="text-xs font-bold">Estimated fee:</p>
        {isEstimating && (
          <Loader className="w-4 h-4 border-black border-r-transparent" />
        )}
        {!isEstimating && enrichedTransactionRequest?.fee && (
          <p className="text-sm text-black">
            {enrichedTransactionRequest?.fee} SOPH
          </p>
        )}
        {enrichedTransactionRequest?.usePaymaster && (
          <p className="text-sm text-black">Sponsored</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          disabled={isSending}
          onClick={() => {
            trackTransactionResult(
              false,
              undefined,
              'User cancelled transaction',
            );
            trackDialogInteraction('transaction_request', 'cancel');

            if (windowService.isManaged() && incomingRequest) {
              const signResponse = {
                id: crypto.randomUUID(),
                requestId: incomingRequest.id,
                content: {
                  result: null,
                  error: {
                    message: 'User cancelled transaction',
                    code: -32002,
                  },
                },
              };

              windowService.sendMessage(signResponse);
              actorRef.send({ type: 'CANCEL' });
            }
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isSending}
          onClick={() => sendTransaction(transactionRequest, incomingRequest)}
        >
          {isSending ? (
            <Loader className="w-4 h-4 border-white border-r-transparent" />
          ) : (
            'Approve'
          )}
        </Button>
      </div>
      {transactionError && (
        <p className="text-red-500 text-xs whitespace-pre-wrap break-words line-clamp-3 text-left">
          {transactionError}
        </p>
      )}
    </div>
  );
}

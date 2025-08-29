import { useEffect } from 'react';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useEnrichTransactionRequest } from '@/hooks/useEnrichTransactionRequest';
import { useSignature } from '@/hooks/useSignature';
import { useTransaction } from '@/hooks/useTransaction';
import {
  trackDialogInteraction,
  trackSigningRequestResult,
  trackTransactionRequest,
  trackTransactionResult,
} from '@/lib/analytics';
import { windowService } from '@/service/window.service';
import type { IncomingRequest, TransactionRequest } from '@/types/auth';

type DrawerContentType = 'raw-transaction' | 'fee-details' | 'error' | null;

interface UseTransactionRequestActionsProps {
  openDrawer?: (type: DrawerContentType, data?: string | object) => void;
}

export const useTransactionRequestActions = (
  props: UseTransactionRequestActionsProps = {},
) => {
  const { openDrawer } = props;
  const { incoming: incomingRequest, transaction: transactionRequest } =
    MainStateMachineContext.useSelector((state) => state.context.requests);
  const actorRef = MainStateMachineContext.useActorRef();
  const { isSigning, signTypedData, signingError } = useSignature();

  const { enrichedTransactionRequest, isLoading, isEstimating } =
    useEnrichTransactionRequest(transactionRequest);
  const { isSending, sendTransaction, transactionError } = useTransaction();

  useEffect(() => {
    if (transactionRequest) {
      trackTransactionRequest(windowService.name, transactionRequest.value);
    }
  }, [transactionRequest]);

  const handleSend = async (
    transactionRequest: TransactionRequest,
    incomingRequest: IncomingRequest,
  ) => {
    // biome-ignore lint/suspicious/noExplicitAny: update to the proper type in the future
    if ((transactionRequest as any).transactionType === 'eip712') {
      // means we are showing as a tx, but we should actually do a typed data signature,
      // as viem (or similar) will then get the signature and send as a raw tx

      // biome-ignore lint/suspicious/noExplicitAny: update to the proper type in the future
      const signingRequestData = (transactionRequest as any).signingRequestData;

      try {
        const signature = await signTypedData(signingRequestData);

        // Track successful tx
        trackTransactionRequest(windowService.name, transactionRequest.value);

        // @Ramon: not sure why this is being handled different on useTransaction vs useSignature,
        // so manually adding it here for now instead of refactoring
        if (windowService.isManaged() && incomingRequest) {
          const signResponse = {
            id: crypto.randomUUID(),
            requestId: incomingRequest.id,
            content: {
              result: signature,
            },
          };

          windowService.sendMessage(signResponse);
          actorRef.send({ type: 'ACCEPT' });
        }
      } catch (error) {
        // Track signing error
        const errorMessage =
          error instanceof Error ? error.message : 'Signing failed';
        trackSigningRequestResult('typed_data', false, errorMessage);
      }
    } else {
      sendTransaction(transactionRequest, incomingRequest);
    }
  };

  const handleCancel = () => {
    trackTransactionResult(false, undefined, 'User cancelled transaction');
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
  };

  const renderActions = () => (
    <div className="flex flex-col gap-4 w-full">
      <Card
        small
        elevated
        className={`w-full flex justify-between items-center gap-2 px-[16px] py-[8px] ${
          openDrawer ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={() =>
          openDrawer?.('fee-details', {
            fee: enrichedTransactionRequest?.fee,
            paymaster: enrichedTransactionRequest?.paymaster,
          })
        }
      >
        <p className="text-sm font-bold h-[36px] flex items-center">
          Estimated fee
        </p>
        {isEstimating && (
          <Loader className="w-4 h-4 border-black border-r-transparent " />
        )}
        {!isEstimating && enrichedTransactionRequest?.fee && (
          <div className="flex flex-col items-end">
            <p className="text-sm text-black font-semibold">
              {enrichedTransactionRequest?.fee?.SOPH} SOPH
            </p>
            {enrichedTransactionRequest?.fee?.USD && (
              <p className="text-xs text-gray-500">
                {enrichedTransactionRequest?.fee?.USD} USD
              </p>
            )}
          </div>
        )}
        {enrichedTransactionRequest?.paymaster &&
          enrichedTransactionRequest?.paymaster !== '0x' && (
            <p className="text-sm text-black">Sponsored</p>
          )}
      </Card>

      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          disabled={isSending || isSigning}
          onClick={handleCancel}
          data-testid="transaction-cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isSending || isSigning}
          onClick={() => handleSend(transactionRequest!, incomingRequest!)}
          data-testid="transaction-accept-button"
        >
          {isSending || isSigning ? (
            <Loader className="w-4 h-4 border-white border-r-transparent" />
          ) : (
            'Approve'
          )}
        </Button>
      </div>

      {(transactionError || signingError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex justify-between items-start">
            <p className="text-red-600 text-sm flex-1">
              {transactionError || signingError}
            </p>
            {openDrawer && (
              <button
                type="button"
                onClick={() =>
                  openDrawer(
                    'error',
                    transactionError || signingError || 'Unknown error',
                  )
                }
                className="ml-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Details
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return {
    renderActions,
    isSending,
    isSigning,
    transactionError,
    signingError,
    incomingRequest,
    transactionRequest,
    enrichedTransactionRequest,
    isLoading,
    isEstimating,
  };
};

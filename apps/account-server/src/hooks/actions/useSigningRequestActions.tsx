import { useEffect } from 'react';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useSignature } from '@/hooks/useSignature';
import {
  trackDialogInteraction,
  trackSigningRequestReceived,
  trackSigningRequestResult,
} from '@/lib/analytics';
import { windowService } from '@/service/window.service';

export const useSigningRequestActions = () => {
  const { account } = useAccountContext();
  const { incoming, typedDataSigning, messageSigning } =
    MainStateMachineContext.useSelector((state) => state.context.requests);
  const actorRef = MainStateMachineContext.useActorRef();
  const { isSigning, signTypeData, signMessage, signingError } = useSignature();

  useEffect(() => {
    if (typedDataSigning) {
      trackSigningRequestReceived('typed_data', windowService.name);
    } else if (messageSigning) {
      trackSigningRequestReceived('message', windowService.name);
    }
  }, [typedDataSigning, messageSigning]);

  const handleCancel = () => {
    const requestType = typedDataSigning ? 'typed_data' : 'message';
    trackSigningRequestResult(requestType, false);
    trackDialogInteraction('signing_request', 'cancel');

    if (windowService.isManaged() && incoming) {
      const signResponse = {
        id: crypto.randomUUID(),
        requestId: incoming.id,
        content: {
          result: null,
          error: {
            message: 'User cancelled signing',
            code: -32002,
          },
        },
      };

      windowService.sendMessage(signResponse);
      actorRef.send({ type: 'CANCEL' });
    }
  };

  const handleSign = async () => {
    const requestType = typedDataSigning ? 'typed_data' : 'message';

    try {
      let signature: string | undefined;
      if (typedDataSigning) {
        signature = await signTypeData(typedDataSigning);
      } else if (messageSigning) {
        signature = await signMessage(messageSigning);
      }

      trackSigningRequestResult(requestType, true);

      if (windowService.isManaged() && incoming) {
        const signResponse = {
          id: crypto.randomUUID(),
          requestId: incoming.id,
          content: {
            result: signature,
          },
        };

        windowService.sendMessage(signResponse);
        actorRef.send({ type: 'ACCEPT' });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Signing failed';
      trackSigningRequestResult(requestType, false, errorMessage);
    }
  };

  const renderActions = () => (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          disabled={isSigning}
          onClick={handleCancel}
          data-testid="signing-cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isSigning}
          onClick={handleSign}
          data-testid="signing-accept-button"
        >
          {isSigning ? (
            <Loader className="w-4 h-4 border-white border-r-transparent" />
          ) : (
            'Sign'
          )}
        </Button>
      </div>
      {signingError && (
        <div className="flex items-center justify-center gap-2 w-full">
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">{signingError}</p>
          </div>
        </div>
      )}
    </div>
  );

  return {
    renderActions,
    isSigning,
    signingError,
    account,
    incoming,
    typedDataSigning,
    messageSigning,
  };
};

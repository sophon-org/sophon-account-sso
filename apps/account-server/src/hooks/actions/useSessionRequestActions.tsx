import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { windowService } from '@/service/window.service';
import { useNetworkStatus } from '../useNetworkStatus';
import { useSessionPermission } from '../useSessionPermission';

type DrawerContentType =
  | 'raw-transaction'
  | 'raw-signing'
  | 'fee-details'
  | 'error'
  | null;

interface UseSessionRequestActionsProps {
  openDrawer?: (type: DrawerContentType, data?: string | object) => void;
}

export const useSessionRequestActions = (
  props: UseSessionRequestActionsProps = {},
) => {
  const { openDrawer } = props;
  const { account } = useAccountContext();
  const { incoming, sessionPermission } = MainStateMachineContext.useSelector(
    (state) => state.context.requests,
  );
  const actorRef = MainStateMachineContext.useActorRef();
  const { approveSessionPermission, isApproving, error } =
    useSessionPermission();
  const { isOffline } = useNetworkStatus();

  const handleCancel = () => {
    if (windowService.isManaged() && incoming) {
      const approvalResponse = {
        id: crypto.randomUUID(),
        requestId: incoming.id,
        content: {
          result: null,
          error: {
            message: 'User cancelled session approval',
            code: -32002,
          },
        },
      };

      windowService.sendMessage(approvalResponse);
      actorRef.send({ type: 'CANCEL' });
    }
  };

  const handleApprove = async () => {
    try {
      const approval = await approveSessionPermission(
        sessionPermission!.signer,
        sessionPermission!.actions,
      );

      if (windowService.isManaged() && incoming) {
        const signResponse = {
          id: crypto.randomUUID(),
          requestId: incoming.id,
          content: {
            result: approval,
          },
        };

        windowService.sendMessage(signResponse);
        actorRef.send({ type: 'ACCEPT' });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Signing failed';
      console.error('Session approval failed:', errorMessage);
      throw error;
    }
  };

  const renderActions = () => (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          disabled={isApproving}
          onClick={handleCancel}
          data-testid="signing-cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isOffline || isApproving}
          onClick={handleApprove}
          data-testid="signing-accept-button"
        >
          {isApproving ? (
            <Loader className="w-4 h-4 border-white border-r-transparent" />
          ) : (
            'Approve'
          )}
        </Button>
      </div>
      {error && (
        <div className="flex items-center justify-center gap-2 w-full">
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex justify-between items-start">
              <p className="text-red-600 text-sm flex-1">{error}</p>
              {openDrawer && (
                <button
                  type="button"
                  onClick={() => openDrawer('error', error || 'Unknown error')}
                  className="ml-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return {
    renderActions,
    isApproving,
    approvalError: error,
    account,
    incoming,
    sessionPermission,
  };
};

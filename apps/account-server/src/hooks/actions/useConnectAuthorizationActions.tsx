import { WarningCircleIcon } from '@phosphor-icons/react';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useConnectionAuthorization } from '@/hooks/auth/useConnectionAuthorization';
import { useNetworkStatus } from '../useNetworkStatus';

type DrawerContentType = 'error' | null;

interface UseConnectAuthorizationActionsProps {
  openDrawer?: (type: DrawerContentType, data?: string | object) => void;
}

export const useConnectAuthorizationActions = (
  props: UseConnectAuthorizationActionsProps = {},
) => {
  const { openDrawer } = props;
  const {
    onRefuseConnection,
    onAcceptConnection,
    isLoading,
    authorizationError,
    signingError,
  } = useConnectionAuthorization();
  const { isOffline } = useNetworkStatus();

  const renderActions = () => (
    <div className="flex flex-col gap-4 w-full">
      {(authorizationError || signingError) && (
        <Card
          small
          elevated
          className="py-4 px-5 rounded-3xl cursor-pointer flex items-center gap-2"
          onClick={() => {
            openDrawer?.(
              'error',
              authorizationError || signingError || 'Unknown error',
            );
          }}
        >
          <WarningCircleIcon weight="fill" className="w-5 h-5 text-red-500" />
          <p className="text-xs flex-1">
            Connection failed. Click for details.
          </p>
        </Card>
      )}

      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          disabled={isLoading}
          onClick={onRefuseConnection}
          data-testid="connect-cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isOffline || isLoading}
          onClick={onAcceptConnection}
          data-testid="connect-accept-button"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 border-white border-r-transparent" />
          ) : (
            'Connect'
          )}
        </Button>
      </div>
    </div>
  );

  return {
    renderActions,
    isLoading,
    onRefuseConnection,
    onAcceptConnection,
    authorizationError,
    signingError,
  };
};

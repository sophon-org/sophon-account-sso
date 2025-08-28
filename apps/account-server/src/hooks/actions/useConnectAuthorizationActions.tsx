import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { useConnectionAuthorization } from '@/hooks/auth/useConnectionAuthorization';

export const useConnectAuthorizationActions = () => {
  const { onRefuseConnection, onAcceptConnection, isLoading } =
    useConnectionAuthorization();

  const renderActions = () => (
    <div
      className="flex items-center justify-center gap-2 w-full"
      data-testid="connect-cancel-button"
    >
      <Button
        variant="transparent"
        disabled={isLoading}
        onClick={onRefuseConnection}
      >
        Cancel
      </Button>
      <Button
        type="button"
        disabled={isLoading}
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
  );

  return {
    renderActions,
    isLoading,
    onRefuseConnection,
    onAcceptConnection,
  };
};

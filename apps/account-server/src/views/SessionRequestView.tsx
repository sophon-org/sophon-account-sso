import { IconSignature } from '@/components/icons/icon-signature';
import { Card } from '@/components/ui/card';
import MessageContainerButton from '@/components/ui/message-container-button';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { useSessionRequestActions } from '@/hooks/actions/useSessionRequestActions';
import { windowService } from '@/service/window.service';

type DrawerContentType =
  | 'raw-transaction'
  | 'raw-signing'
  | 'raw-session'
  | 'fee-details'
  | 'error'
  | null;

interface SessionRequestViewProps {
  openDrawer?: (type: DrawerContentType, data?: string | object) => void;
}

export default function SessionRequestView({
  openDrawer,
}: SessionRequestViewProps = {}) {
  const isMobile = windowService.isMobile();
  const { account, incoming, sessionPermission } = useSessionRequestActions({
    openDrawer,
  });

  if (!sessionPermission || !incoming || !account) {
    return <div>No signing request or account present</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-3">
      {!isMobile && (
        <VerificationImage icon={<IconSignature className="w-10 h-10" />} />
      )}
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Session Approval</h5>
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>
      <div>
        <Card>
          <div className="w-full flex justify-between items-center px-6 py-4">
            <p className="text-sm font-bold">Primary Type</p>
            <p className="text-sm text-black">Session Permission</p>
          </div>
        </Card>
        <MessageContainer showBottomButton={!!openDrawer} isMobile={isMobile}>
          <div className="text-sm text-black">
            <pre>{JSON.stringify(sessionPermission, null, 2)}</pre>
          </div>
          {openDrawer && (
            <MessageContainerButton onClick={() => openDrawer('raw-session')}>
              View raw session data
            </MessageContainerButton>
          )}
        </MessageContainer>
      </div>
    </div>
  );
}

// Export the actions hook for the root component to use
SessionRequestView.useActions = useSessionRequestActions;

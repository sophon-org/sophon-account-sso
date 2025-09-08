import { IconSignature } from '@/components/icons/icon-signature';
import { Card } from '@/components/ui/card';
import MessageContainerButton from '@/components/ui/message-container-button';
import MessageContainer from '@/components/ui/messageContainer';
import TypedDataDisplay from '@/components/ui/typed-data-display';
import VerificationImage from '@/components/ui/verification-image';
import { useSigningRequestActions } from '@/hooks/actions/useSigningRequestActions';
import { windowService } from '@/service/window.service';

type DrawerContentType =
  | 'raw-transaction'
  | 'raw-signing'
  | 'fee-details'
  | 'error'
  | null;

interface SigningRequestViewProps {
  openDrawer?: (type: DrawerContentType, data?: string | object) => void;
}

export default function SigningRequestView({
  openDrawer,
}: SigningRequestViewProps = {}) {
  const isMobile = windowService.isMobile();
  const { account, incoming, typedDataSigning, messageSigning } =
    useSigningRequestActions({ openDrawer });

  if ((!typedDataSigning && !messageSigning) || !incoming || !account) {
    return <div>No signing request or account present</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-3">
      {!isMobile && (
        <VerificationImage icon={<IconSignature className="w-10 h-10" />} />
      )}
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Signature request</h5>
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>
      {typedDataSigning && (
        <div>
          <Card>
            <div className="w-full flex justify-between items-center px-6 py-4">
              <p className="text-sm font-bold">Primary Type</p>
              <p className="text-sm text-black">
                {typedDataSigning.primaryType}
              </p>
            </div>
          </Card>
          <MessageContainer showBottomButton={!!openDrawer} isMobile={isMobile}>
            <div className="text-sm text-black">
              <TypedDataDisplay data={typedDataSigning.message} />
            </div>
            {openDrawer && (
              <MessageContainerButton onClick={() => openDrawer('raw-signing')}>
                View raw signing data
              </MessageContainerButton>
            )}
          </MessageContainer>
        </div>
      )}
      {messageSigning && (
        <MessageContainer showBottomButton={!!openDrawer}>
          <div className="text-sm text-black">
            <pre className="text-xs mt-2 whitespace-pre-wrap break-words">
              {messageSigning.message}
            </pre>
          </div>
          {openDrawer && (
            <MessageContainerButton onClick={() => openDrawer('raw-signing')}>
              View raw signing data
            </MessageContainerButton>
          )}
        </MessageContainer>
      )}
    </div>
  );
}

// Export the actions hook for the root component to use
SigningRequestView.useActions = useSigningRequestActions;

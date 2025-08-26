import { IconSignature } from '@/components/icons/icon-signature';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { useSigningRequestActions } from '@/hooks/actions/useSigningRequestActions';

export default function SigningRequestView() {
  const { account, incoming, typedDataSigning, messageSigning } =
    useSigningRequestActions();

  if ((!typedDataSigning && !messageSigning) || !incoming || !account) {
    return <div>No signing request or account present</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-3">
      <VerificationImage icon={<IconSignature className="w-10 h-10" />} />
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Signature request</h5>
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>
      {typedDataSigning && (
        <MessageContainer>
          <div className="text-sm text-black">
            <p>
              {typedDataSigning.domain.name} v{typedDataSigning.domain.version}
            </p>
            <pre className="text-xs mt-2 whitespace-pre-wrap break-words">
              {JSON.stringify(typedDataSigning.message, null, 2)}
            </pre>
          </div>
        </MessageContainer>
      )}
      {messageSigning && (
        <MessageContainer>
          <div className="text-sm text-black">
            <pre className="text-xs mt-2 whitespace-pre-wrap break-words">
              {messageSigning.message}
            </pre>
          </div>
        </MessageContainer>
      )}
    </div>
  );
}

// Export the actions hook for the root component to use
SigningRequestView.useActions = useSigningRequestActions;

import { IconSignature } from '@/components/icons/icon-signature';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useSignature } from '@/hooks/useSignature';
import { serverLog } from '@/lib/server-log';
import { windowService } from '@/service/window.service';

export default function SigningRequestView() {
  const { account } = useAccountContext();
  const { incoming, typedDataSigning, messageSigning } =
    MainStateMachineContext.useSelector((state) => state.context.requests);
  const actorRef = MainStateMachineContext.useActorRef();
  const { isSigning, signTypeData, signMessage } = useSignature();

  if ((!typedDataSigning && !messageSigning) || !incoming || !account) {
    return <div>No signing request or account present</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-6 px-6">
      <VerificationImage icon={<IconSignature className="w-24 h-24" />} />
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

      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="transparent"
          onClick={() => {
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
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={async () => {
            let signature: string | undefined;
            if (typedDataSigning) {
              signature = await signTypeData(typedDataSigning);
            } else if (messageSigning) {
              signature = await signMessage(messageSigning);
            }

            if (windowService.isManaged() && incoming) {
              const signResponse = {
                id: crypto.randomUUID(),
                requestId: incoming.id,
                content: {
                  result: signature,
                },
              };

              serverLog(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥 signResponse ${signature}`);
              windowService.sendMessage(signResponse);
              actorRef.send({ type: 'ACCEPT' });
            }
          }}
        >
          {isSigning ? (
            <Loader className="w-4 h-4 border-black border-r-transparent" />
          ) : (
            'Sign'
          )}
        </Button>
      </div>
    </div>
  );
}

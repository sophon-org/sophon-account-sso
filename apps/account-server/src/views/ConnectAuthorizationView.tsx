'use client';

import { IconSignature } from '@/components/icons/icon-signature';
import { IconGreenCheck } from '@/components/icons/icons-green-check';
import { IconRedCheck } from '@/components/icons/icons-red-check';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAccountContext } from '@/hooks/useAccountContext';

export default function ConnectAuthorizationView() {
  const { incoming, authentication } = MainStateMachineContext.useSelector(
    (state) => state.context.requests,
  );
  const { account } = useAccountContext();

  if (!authentication || !incoming || !account) {
    return <div>No authentication request or account present</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-6 px-6">
      <VerificationImage icon={<IconSignature className="w-24 h-24" />} />
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Connection request</h5>
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>
      <MessageContainer>
        <div className="flex flex-col gap-16 text-base text-black">
          <div className="flex flex-col gap-2">
            <p className="font-bold ">It can</p>
            <p className="flex items-start gap-2">
              <span>
                <IconGreenCheck className="w-6 h-6" />
              </span>
              See your address/identity, balances and activity
            </p>
            <p className="flex items-start gap-2">
              <span>
                <IconGreenCheck className="w-6 h-6" />
              </span>
              Ask for transactions to be approved
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-bold ">It can't</p>
            <p className="flex items-start gap-2">
              <span>
                <IconRedCheck className="w-6 h-6" />
              </span>
              Perform actions or transfer funds on your behalf
            </p>
          </div>
        </div>
      </MessageContainer>
    </div>
  );
}

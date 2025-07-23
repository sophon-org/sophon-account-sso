import { IconAlert } from '@/components/icons/icon-alert';
import { IconCheck } from '@/components/icons/icon-check';
import { IconSophon } from '@/components/icons/icon-sophon';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';

export default function LoginRequestView() {
  return (
    <div className="text-center flex flex-col items-center justify-center gap-8 mt-6 px-6">
      <VerificationImage icon={<IconSophon className="w-24 h-24" />} />
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Sign in to</h5>
        <p className="">https://localhost:3000</p>
      </div>
      <MessageContainer>
        <div className="flex flex-col gap-16 text-base text-black">
          <div className="flex flex-col gap-2">
            <p className="font-bold ">It can</p>
            <p className="flex items-start gap-2">
              <span>
                <IconCheck className="w-6 h-6" />
              </span>
              See your address/identity, balances and activity
            </p>
            <p className="flex items-start gap-2">
              <span>
                <IconCheck className="w-6 h-6" />
              </span>
              Ask for transactions to be approved
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-bold ">It can't</p>
            <p className="flex items-start gap-2">
              <span>
                <IconAlert className="w-6 h-6" />
              </span>
              Perform actions or transfer funds on your behalf
            </p>
          </div>
        </div>
      </MessageContainer>
    </div>
  );
}

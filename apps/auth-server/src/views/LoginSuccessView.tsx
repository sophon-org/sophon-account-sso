import VerificationImage from '@/components/ui/verification-image';
import { shortenAddress } from '@/lib/formatting';
import type { LoginSuccessProps } from '@/types/auth';

export default function LoginSuccessView({
  accountData,
  sessionPreferences,
  onUseAccount,
  onDisconnect,
}: LoginSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-6">
      <VerificationImage image="/images/avatar-example.png" />

      <h5 className="text-lg font-bold">
        {shortenAddress(accountData.address)}
      </h5>
    </div>
  );
}

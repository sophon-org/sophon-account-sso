import VerificationImage from '@/components/ui/verification-image';
import { useAccountContext } from '@/hooks/useAccountContext';

export default function LoginSuccessView() {
  const { account } = useAccountContext();
  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-6 flex-grow">
      <VerificationImage image="/images/avatar-example.png" />

      <h5 className="text-lg font-bold">{shortenAddress(account?.address)}</h5>
    </div>
  );
}

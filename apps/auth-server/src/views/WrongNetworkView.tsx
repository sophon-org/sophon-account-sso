import Image from 'next/image';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';

export default function WrongNetworkView({
  onSwitchNetwork,
}: {
  onSwitchNetwork: () => void;
}) {
  const { connector } = useAccount();
  const walletIcon = connector?.icon;

  return (
    <div className="mt-6 flex flex-col gap-8 items-center justify-center text-center">
      <p className="text-gray-600 mb-4">
        Please connect your wallet to Sophon in order to proceed
      </p>
      <Image
        src={walletIcon ?? ''}
        alt="Wrong network"
        className="w-[142px] h-[142px]"
        width={142}
        height={142}
      />
      <div className="w-[254px]">
        <Button
          variant="secondary"
          onClick={onSwitchNetwork}
          className="w-full"
        >
          Switch network to Sophon
        </Button>
      </div>
    </div>
  );
}

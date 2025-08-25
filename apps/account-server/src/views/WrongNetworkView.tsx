import Image from 'next/image';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useAuthCallbacks } from '@/hooks/auth/useAuthActions';
import { trackNetworkEvent } from '@/lib/analytics';

export default function WrongNetworkView() {
  const { switchEOANetwork } = useAuthCallbacks();
  const { connector, chainId } = useAccount();
  const walletIcon = connector?.icon;

  // Track wrong network detection
  useEffect(() => {
    trackNetworkEvent('wrong_network_detected', chainId);
  }, [chainId]);

  return (
    <div className="mt-3 flex flex-col gap-8 items-center justify-center text-center">
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
          onClick={() => {
            trackNetworkEvent('network_switch_started', chainId);
            switchEOANetwork();
          }}
          className="w-full"
        >
          Switch network to Sophon
        </Button>
      </div>
    </div>
  );
}

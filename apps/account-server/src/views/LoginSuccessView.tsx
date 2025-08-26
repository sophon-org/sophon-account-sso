import { shortenAddress } from '@sophon-labs/account-core';
import { useEffect, useState } from 'react';
import { IconCopy } from '@/components/icons/icon-copy';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import VerificationImage from '@/components/ui/verification-image';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAccount, useConnect } from 'wagmi';
import { MainStateMachineContext } from '@/context/state-machine-context';

export default function LoginSuccessView() {
  const state = MainStateMachineContext.useSelector((state) => state);
  const { account } = useAccountContext();
  const [isCopied, setIsCopied] = useState(false);

  function copyAddressToClipboard() {
    navigator.clipboard.writeText(account!.address);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  const { address, isConnected } = useAccount();
  console.log('address', address);
  console.log('isConnected', isConnected);

  useEffect(() => {
    console.log('state', state);
  }, [state]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-3 flex-grow">
      <VerificationImage image="/images/avatar-example.png" />
      <div className="flex flex-row items-center gap-2">
        <h5 className="text-lg font-bold">
          {shortenAddress(account?.address)}
        </h5>
        <Tooltip delayDuration={0} open={isCopied}>
          <TooltipTrigger asChild>
            <button type="button" onClick={copyAddressToClipboard}>
              <IconCopy className="cursor-pointer w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Copied!</TooltipContent>
        </Tooltip>
      </div>
      <div>
        <button
          type="button"
          onClick={() => {
            console.log('connect again');
          }}
        >
          Connect Again
        </button>
      </div>
    </div>
  );
}

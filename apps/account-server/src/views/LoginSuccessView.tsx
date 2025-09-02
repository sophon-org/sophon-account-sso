import {
  getSVGAvatarFromString,
  shortenAddress,
} from '@sophon-labs/account-core';
import { useState } from 'react';
import { IconCopy } from '@/components/icons/icon-copy';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import VerificationImage from '@/components/ui/verification-image';
import { env } from '@/env';
import { useAccountContext } from '@/hooks/useAccountContext';
import TestSessionView from './TestSessionView';

export default function LoginSuccessView() {
  const { account } = useAccountContext();
  const [isCopied, setIsCopied] = useState(false);

  function copyAddressToClipboard() {
    navigator.clipboard.writeText(account!.address);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  const avatarUrl = account?.address && getSVGAvatarFromString(account.address);

  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-3 flex-grow">
      {avatarUrl && <VerificationImage image={avatarUrl} />}
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
      {env.NEXT_PUBLIC_SHOW_TEST_SCREEN && <TestSessionView />}
    </div>
  );
}

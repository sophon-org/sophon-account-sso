import type { ProviderEnum } from '@dynamic-labs/types';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/loader';
import VerificationImage from '@/components/ui/verification-image';
import {
  getSocialProviderFromURL,
  getSocialProviderIcon,
} from '@/lib/social-provider';
import { windowService } from '@/service/window.service';

export const LoadingView = ({ message }: { message?: string }) => {
  const [socialProvider, setSocialProvider] = useState<ProviderEnum | null>(
    null,
  );
  const isMobile = windowService.isMobile();

  useEffect(() => {
    const provider = getSocialProviderFromURL();
    if (provider) {
      setSocialProvider(provider);
    }
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-8 mt-3 flex-grow ${
        !isMobile ? 'h-[calc(100vh-100px)]' : ''
      }`}
    >
      {socialProvider ? (
        <VerificationImage icon={getSocialProviderIcon(socialProvider)} />
      ) : (
        <Loader className="h-10 w-10 animate-spin block border-black border-r-transparent" />
      )}
      <p className="ml-2 mt-2">{message ?? 'Loading...'}</p>
    </div>
  );
};

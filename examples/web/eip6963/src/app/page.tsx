'use client';

import { ConnectKitButton, useIsMounted } from 'connectkit';
import { useAccount } from 'wagmi';
import { Loader } from '../../components/loader';
import { Logo } from '../../components/logo';
import { PaymasterProvider } from '../../components/paymaster.provider';
import { ProfilePanel } from '../../components/profile.panel';

export default function Home() {
  const isMounted = useIsMounted();
  const { isConnected } = useAccount();

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col gap-2 max-w-md items-center">
          <Logo className="mb-4" />
          <Loader className="mt-4" />
        </div>
      </div>
    );
  }

  return (
    <PaymasterProvider>
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col gap-2 max-w-md w-full items-center">
          <Logo className="mb-4" />
          <ConnectKitButton theme="midnight" />
          {isConnected && <ProfilePanel />}
        </div>
      </div>
    </PaymasterProvider>
  );
}

'use client';

import { useSophonAccount } from '@sophon-labs/account-react';
import { useIsMounted } from 'connectkit';
import { useAccount } from 'wagmi';
import Connectors from '../../components/connectors';
import { Loader } from '../../components/loader';
import { Logo } from '../../components/logo';
import { PaymasterProvider } from '../../components/paymaster.provider';
import { ProfilePanel } from '../../components/profile.panel';

export default function Home() {
  const isMounted = useIsMounted();

  const { isConnected: wagmiConnected } = useAccount();
  const { isConnected: sophonConnected, account } = useSophonAccount();
  const isConnected = wagmiConnected || sophonConnected || !!account?.address;

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
          <Connectors />
          {isConnected ? <ProfilePanel /> : null}
        </div>
      </div>
    </PaymasterProvider>
  );
}

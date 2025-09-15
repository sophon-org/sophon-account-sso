'use client';

import { useSophonAccount } from '@sophon-labs/account-react';
import { ConnectButton } from '../../components/connect-button';
import { Logo } from '../../components/logo';
import { ProfilePanel } from '../../components/profile.panel';

export default function Home() {
  const { isConnected } = useSophonAccount();

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col gap-2 max-w-md w-full items-center">
        <Logo className="mb-4" />
        {isConnected ? <ProfilePanel /> : <ConnectButton />}
      </div>
    </div>
  );
}

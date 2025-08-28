'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '../../components/connect-button';
import { Logo } from '../../components/logo';
import { ProfilePanel } from '../../components/profile.panel';
import { totalTestableActions } from '../../lib/actions';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col gap-2 max-w-xl w-full items-center">
        <Logo className="mb-4" />
        {isConnected ? <ProfilePanel /> : <ConnectButton />}
        <div className="flex flex-col gap-2">
          <p>Total testable actions: {totalTestableActions}</p>
        </div>
      </div>
    </div>
  );
}

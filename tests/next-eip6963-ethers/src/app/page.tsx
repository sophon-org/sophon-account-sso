'use client';

import { ConnectButton } from '../../components/connect-button';
import { Logo } from '../../components/logo';
import { ProfilePanel } from '../../components/profile.panel';
import { useEthereumContext } from '../../hooks/useEthereumContext';
import { totalEthersActions } from '../../lib/actions';

export default function Home() {
  const { account } = useEthereumContext();
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col gap-2 max-w-xl w-full items-center">
        <Logo className="mb-4" />

        {account.isConnected ? <ProfilePanel /> : <ConnectButton />}
        <div className="flex flex-col gap-2">
          <p>Total testable actions: {totalEthersActions}</p>
        </div>
      </div>
    </div>
  );
}

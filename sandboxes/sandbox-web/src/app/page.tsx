'use client';

import { useSophonAccount } from '@sophon-labs/account-react';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@/components/connect-button';
import { Logo } from '@/components/logo';
import { PaymasterProvider } from '@/components/paymaster.provider';
import { ProfilePanel } from '@/components/profile.panel';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useSophonAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <PaymasterProvider>
      <div className="flex justify-center h-screen">
        <div className="flex flex-col gap-2 max-w-md w-full items-center justify-center">
          <Logo className="mb-4" />
          {!isConnected && <ConnectButton />}
          {isConnected && <ProfilePanel />}
        </div>
      </div>
    </PaymasterProvider>
  );
}

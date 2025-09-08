'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '../../components/connect-button';
import { Logo } from '../../components/logo';
import { ProfilePanel } from '../../components/profile.panel';

export default function Home() {
  const { isConnected } = useAccount();
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin === 'http://localhost:3000') {
        console.log('MESSAGE', event.origin, event.data, event);
      }
    };
    window.addEventListener('message', listener);
    return () => {
      window.removeEventListener('message', listener);
    };
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col gap-2 max-w-md w-full items-center">
        <Logo className="mb-4" />
        {isConnected ? <ProfilePanel /> : <ConnectButton />}
      </div>
    </div>
  );
}

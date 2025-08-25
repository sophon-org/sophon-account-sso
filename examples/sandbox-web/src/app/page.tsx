'use client';

import { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@/components/connect-button';
import { Logo } from '@/components/logo';
import { PaymasterProvider } from '@/components/paymaster.provider';
import { ProfilePanel } from '@/components/profile.panel';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Handle logout from popup
    window.addEventListener('message', (event) => {
      if (event.data.type === 'logout') {
        disconnect();
      }
    });
  }, [disconnect]);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // const handleWagmiConnect = () => {
  //   const sophonConnector = connectors.find((c) => c.name === 'ZKsync');

  //   if (sophonConnector) {
  //     connect({
  //       connector: sophonConnector,
  //       chainId: sophonTestnet.id,
  //     });
  //   } else {
  //     console.error('Sophon connector not found!');
  //   }
  // };

  // const handleWagmiDisconnect = async () => {
  //   if (walletClient) {
  //     // disconnect wagmi
  //     disconnect();
  //     // disconnect sophon
  //     walletClient.request({ method: 'wallet_disconnect' });

  //     // experimental ERC-7846 approach to explore later
  //     /* try {
  //       const extendedWalletClient = walletClient.extend(erc7846Actions());
  //       // Use ERC-7846 standardized disconnect
  //       const result = await extendedWalletClient.disconnect();
  //       console.log('ERC-7846 disconnect result:', result);
  //     } catch (error) {
  //       console.warn('ERC-7846 disconnect failed:', error);
  //       // Fallback to regular wagmi disconnect
  //       disconnect();
  //     } */
  //   } else {
  //     // Fallback to regular wagmi disconnect
  //     disconnect();
  //   }
  // };

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

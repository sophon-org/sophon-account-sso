import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useConnect } from 'wagmi';
import { WalletConnectQR } from '@/components/wallet-connect/WalletConnectQR';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAuthCallbacks } from '@/hooks/auth/useAuthActions';
import { useWalletConnect } from '@/hooks/auth/useWalletConnect';
import {
  SUPPORTED_WALLETS,
  type SupportedWallet,
} from '@/lib/supportedWallets';

export default function SelectingWalletView() {
  const state = MainStateMachineContext.useSelector((state) => state);
  const actorRef = MainStateMachineContext.useActorRef();
  const { connectEOA } = useAuthCallbacks();
  const { connectors } = useConnect();
  const [search, setSearch] = useState('');
  const [availableWallets, setAvailableWallets] = useState<SupportedWallet[]>(
    [],
  );
  const {
    initializeWalletConnect,
    qrCodeDataUrl,
    isLoading,
    error,
    showQR,
    setShowQR,
  } = useWalletConnect();

  const handleWalletClick = async (wallet: SupportedWallet) => {
    const connector = connectors.find((c) => c.name === wallet.name);

    // Special handling for WalletConnect
    if (wallet.name === 'WalletConnect') {
      actorRef.send({ type: 'WALLET_CONNECT_SELECTED' });
      await initializeWalletConnect();
      return;
    }

    if (connector) {
      connectEOA(connector.name);
    } else {
      // Wallet not installed - redirect to installation
      window.open(wallet.downloadUrl, '_blank');
    }
  };

  const getAvailableWallets = useCallback(() => {
    const installedWallets = connectors.filter(
      (c) => c.id !== 'injected' && c.id !== 'walletConnect',
    );
    const availableWallets = installedWallets.map((c) => ({
      name: c.name,
      icon: c.icon?.replace(/\n/g, '').replace(' ', ''),
    }));
    const removedDuplicates = SUPPORTED_WALLETS.filter(
      (wallet) => !availableWallets.some((c) => c.name === wallet.name),
    );
    const allAvailableWallets = [...availableWallets, ...removedDuplicates];
    setAvailableWallets(allAvailableWallets);
  }, [connectors]);

  useEffect(() => {
    getAvailableWallets();
  }, [getAvailableWallets]);

  // Close QR when user goes back to select wallet view
  useEffect(() => {
    if (!state.context.isWalletConnectActive && showQR) {
      setShowQR(false);
    }
  }, [state.context.isWalletConnectActive, setShowQR, showQR]);

  if (showQR) {
    return (
      <WalletConnectQR
        qrCodeDataUrl={qrCodeDataUrl}
        isLoading={isLoading}
        error={error}
        onSuccess={() => {
          connectEOA('WalletConnect');
          actorRef.send({ type: 'WALLET_CONNECTED' });
        }}
      />
    );
  }

  return (
    <div className="">
      <input
        className="w-full h-14 p-3 bg-white border border-[#EBE9E6] rounded-md placeholder:text-[#CCCAC8] placeholder:text-lg mt-4 mb-8"
        type="text"
        name="search"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ul className="flex flex-col gap-2">
        {availableWallets
          .filter((wallet) =>
            wallet.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map((wallet) => {
            const isInstalled = connectors.some(
              (connector) => connector.name === wallet.name,
            );

            return (
              <li key={wallet.name}>
                <button
                  type="button"
                  onClick={() => handleWalletClick(wallet)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <Image
                        src={wallet.icon || ''}
                        alt={wallet.name}
                        width={20}
                        height={20}
                      />
                    </div>
                    <p className="font-medium">{wallet.name}</p>
                  </div>
                  {isInstalled && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#37f] rounded-full"></div>
                      <p className="text-sm text-[#37f]">Installed</p>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

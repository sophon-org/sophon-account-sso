import Image from 'next/image';
import { useState } from 'react';
import { useConnect } from 'wagmi';
import {
  SUPPORTED_WALLETS,
  type SupportedWallet,
} from '@/lib/supportedWallets';

export default function SelectingWalletView({
  onSelectWallet,
}: {
  onSelectWallet: (connectorName: string) => void;
}) {
  const { connectors } = useConnect();
  const [search, setSearch] = useState('');
  const handleWalletClick = (wallet: SupportedWallet) => {
    const connector = connectors.find((c) => c.name === wallet.name);

    if (connector) {
      onSelectWallet(connector.name);
    } else {
      // Wallet not installed - redirect to installation
      window.open(wallet.downloadUrl, '_blank');
    }
  };

  return (
    <div>
      <input
        className="w-full h-14 p-3 bg-white border border-[#EBE9E6] rounded-md placeholder:text-[#CCCAC8] placeholder:text-lg mt-4 mb-8"
        type="text"
        name="search"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ul className="flex flex-col gap-2">
        {SUPPORTED_WALLETS.filter((wallet) =>
          wallet.name.toLowerCase().includes(search.toLowerCase()),
        ).map((wallet) => {
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
                      src={wallet.icon}
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

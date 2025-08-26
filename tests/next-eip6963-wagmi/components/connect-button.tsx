'use client';

import { sophonTestnet } from 'viem/chains';
import { useConfig } from 'wagmi';
import { connect, getConnectors } from 'wagmi/actions';

export const ConnectButton = () => {
  const wagmiConfig = useConfig();
  const handleConnect = async () => {
    const connectors = getConnectors(wagmiConfig);
    const connector = connectors.find(
      (provider) => provider.id === `xyz.sophon.staging.my`,
    );

    if (!connector) {
      throw new Error('Connector not found');
    }

    await connect(wagmiConfig, {
      chainId: sophonTestnet.id,
      connector: connector,
    });
  };

  return (
    <button
      data-testid="connect-button"
      className="bg-purple-500/30 text-black border border-purple-500/50 px-4 py-2 rounded-md hover:bg-purple-500/50 transition-all duration-300 hover:cursor-pointer"
      type="button"
      onClick={handleConnect}
    >
      Connect With Sophon
    </button>
  );
};

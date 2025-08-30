'use client';

import { useEthereumContext } from '../hooks/useEthereumContext';

export const ConnectButton = () => {
  const { connect } = useEthereumContext();
  const handleConnect = async () => {
    await connect();
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

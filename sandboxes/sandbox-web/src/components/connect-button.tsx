import { sophonTestnet } from 'viem/chains';
import { useConnect } from 'wagmi';

export const ConnectButton = () => {
  const { connect, connectors, isPending, error: connectError } = useConnect();

  const handleWagmiConnect = () => {
    const sophonConnector = connectors.find((c) => c.name === 'ZKsync');

    if (sophonConnector) {
      connect({
        connector: sophonConnector,
        chainId: sophonTestnet.id,
      });
    } else {
      console.error('Sophon connector not found!');
    }
  };

  return (
    <>
      {connectError && (
        <div className="text-red-500">{connectError.message}</div>
      )}
      <button
        type="button"
        onClick={handleWagmiConnect}
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 hover:cursor-pointer"
      >
        {isPending ? 'Connecting...' : 'Connect with Wagmi'}
      </button>
    </>
  );
};

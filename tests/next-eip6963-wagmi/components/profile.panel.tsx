import { formatUnits } from 'viem';
import { useAccount, useBalance, useConfig } from 'wagmi';
import { disconnect } from 'wagmi/actions';

export const ProfilePanel = () => {
  const wagmiConfig = useConfig();
  const { isConnected, address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const handleDisconnect = async () => {
    await disconnect(wagmiConfig);
  };

  if (!isConnected) return null;

  return (
    <div className="flex flex-col gap-1 mt-2  w-full min-w-full wrap-anywhere">
      <div className="flex flex-col gap-2 border border-gray-300 rounded-md p-4">
        <p className="text-sm text-gray-500">
          <span className="font-bold">Status:</span>{' '}
          <span className="text-green-500">Connected</span>
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">User Address:</span> {address}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">Soph:</span>{' '}
          {balance ? formatUnits(balance.value, balance.decimals) : '0'}
        </p>
        <button
          className="bg-red-500/30 text-black border border-red-500/50 px-4 py-2 rounded-md hover:bg-red-500/50 transition-all duration-300 hover:cursor-pointer"
          type="button"
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

import { formatUnits } from 'viem';
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useConfig,
  useReadContract,
} from 'wagmi';
import { disconnect } from 'wagmi/actions';
import { nftAbi } from '../e2e/functions/abi/nft';

export const ProfilePanel = () => {
  const wagmiConfig = useConfig();
  const { isConnected, address } = useAccount();
  const { data: currentBlock } = useBlockNumber();
  const { data: balanceSOPH } = useBalance({
    address,
  });

  const { data: balanceERC20 } = useBalance({
    address,
    token: process.env.NEXT_PUBLIC_TOKEN_ERC20_TOKEN as `0x${string}`,
  });

  const { data: nftBalance } = useReadContract({
    address: process.env.NEXT_PUBLIC_NFT_ADDRESS as `0x${string}`,
    abi: nftAbi,
    functionName: 'balanceOf',
    args: [address],
    account: address,
  } as const);

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
          <span className="font-bold">Current Block:</span> {currentBlock}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">Soph:</span>{' '}
          {balanceSOPH
            ? formatUnits(balanceSOPH.value, balanceSOPH.decimals)
            : '0'}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">ERC20 Token:</span>{' '}
          {balanceERC20
            ? formatUnits(balanceERC20.value, balanceERC20.decimals)
            : '0'}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">Minted NFTs:</span>{' '}
          {nftBalance ? `${nftBalance as unknown}` : '0'}
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

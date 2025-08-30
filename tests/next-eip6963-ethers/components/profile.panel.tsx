import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { Contract } from 'zksync-ethers';
import { nftAbi } from '@/abi/nft';
import { useEthereumContext } from '../hooks/useEthereumContext';

export const ProfilePanel = () => {
  const { account, disconnect, browserProvider } = useEthereumContext();
  const [state, setState] = useState<{
    currentBlock?: number | null;
    balanceSOPH?: bigint | null;
    balanceERC20?: bigint | null;
    nftBalance?: bigint | null;
  }>({});

  const NFTContract = useMemo(() => {
    if (!browserProvider) return null;
    return new Contract(
      process.env.NEXT_PUBLIC_NFT_ADDRESS as `0x${string}`,
      nftAbi,
      browserProvider,
    );
  }, [browserProvider]);

  useEffect(() => {
    (async () => {
      if (browserProvider) {
        const [currentBlock, balanceSOPH, balanceERC20, nftBalance] =
          await Promise.all([
            browserProvider?.getBlockNumber(),
            browserProvider.getBalance(account.address as string),
            browserProvider.getBalance(
              account.address as string,
              'latest',
              process.env.NEXT_PUBLIC_TOKEN_ERC20_TOKEN as `0x${string}`,
            ),
            NFTContract?.balanceOf(account.address as string),
          ]);
        setState((prev) => ({
          ...prev,
          currentBlock,
          balanceSOPH,
          balanceERC20,
          nftBalance,
        }));
      }
    })();
  }, [browserProvider, account, NFTContract]);

  const handleDisconnect = async () => {
    disconnect();
  };

  if (!account.isConnected) return null;

  return (
    <div className="flex flex-col gap-1 mt-2  w-full min-w-full wrap-anywhere">
      <div className="flex flex-col gap-2 border border-gray-300 rounded-md p-4">
        <p className="text-sm text-gray-500">
          <span className="font-bold">Status:</span>{' '}
          <span className="text-green-500">Connected</span>
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">User Address:</span> {account.address}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">Current Block:</span> {state.currentBlock}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">Soph:</span>{' '}
          {state.balanceSOPH ? formatUnits(state.balanceSOPH, 18) : '0'}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">ERC20 Token:</span>{' '}
          {state.balanceERC20 ? formatUnits(state.balanceERC20, 18) : '0'}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-bold">Minted NFTs:</span>{' '}
          {state.nftBalance ? `${state.nftBalance as unknown}` : '0'}
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

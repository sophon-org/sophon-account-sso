import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { useAccount } from 'wagmi';
import { nftAbi } from '../src/abi/nft';
import { useWriteContractWithPaymaster } from '../utils/useWriteContractWithPaymaster';

export default function UnverifiedPanel() {
  const { address } = useAccount();

  const { data, error, writeContract, isPending } =
    useWriteContractWithPaymaster();
  const {
    data: paidData,
    error: paidError,
    writeContract: paidWriteContract,
    isPending: paidIsPending,
  } = useWriteContractWithPaymaster();

  const [txType, setTxType] = useState<'free' | 'paid' | undefined>(undefined);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);

  const mintNft = async () => {
    setTxType('free');
    writeContract({
      address: '0x1A88CEB0Ef27383f4FB85231765AB8Cf7B27B99C', // MOCK NFT contract
      abi: nftAbi,
      functionName: 'mint',
      args: [address as `0x${string}`],
    });
  };

  const mintPaidNft = async () => {
    setTxType('paid');
    paidWriteContract({
      address: '0x1A88CEB0Ef27383f4FB85231765AB8Cf7B27B99C', // MOCK NFT contract
      abi: nftAbi,
      functionName: 'paidMint',
      value: parseEther('1'),
      args: [address as `0x${string}`],
    });
  };

  useEffect(() => {
    if (data || paidData) {
      setTxError(undefined);
      if (txType === 'free') {
        setTxHash(data);
      } else if (txType === 'paid') {
        setTxHash(paidData);
      }
    }
  }, [data, paidData, txType]);

  useEffect(() => {
    if (error || paidError) {
      setTxHash(undefined);
      if (txType === 'free') {
        setTxError((error as { details?: string })?.details ?? error?.message);
      } else if (txType === 'paid') {
        setTxError(
          (paidError as { details?: string })?.details ?? paidError?.message,
        );
      }
    }
  }, [error, paidError, txType]);

  return (
    <div>
      <h2 className="text-xl font-bold mt-4">NFT</h2>
      <div className="flex flex-row gap-2 mt-2 w-full">
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={mintNft}
          type="button"
        >
          🐶 {isPending ? 'Minting...' : 'Mint NFT'}
        </button>
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={mintPaidNft}
          type="button"
        >
          💴 {paidIsPending ? 'Minting...' : 'Mint Paid NFT'}
        </button>
      </div>

      {txError && (
        <p className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          {txError}
        </p>
      )}
      {txHash && (
        <a
          href={`https://testnet.sophscan.xyz/tx/${txHash}`}
          target="_blank"
          className="block text-sm bg-yellow-400/10 p-2 rounded-md border border-yellow-400 text-yellow-400 break-all my-2 w-full"
        >
          Tx hash: {txHash?.substring(0, 20)}...
          {txHash?.substring(txHash.length - 20)}
        </a>
      )}
    </div>
  );
}

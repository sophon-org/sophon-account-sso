import { useAccount, useWriteContract } from 'wagmi';

export default function UnverifiedPanel() {
  const { address } = useAccount();

  const { data, error, writeContract, isPending } = useWriteContract();

  const minNft = () => {
    writeContract({
      address: '0x1bbA25233556a7C3b41913F35A035916DbeD1664', // MOCK NFT contract
      abi: [
        {
          inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
          name: 'mint',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      functionName: 'mint',
      args: [address as `0x${string}`],
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mt-4">NFT</h2>
      <div className="flex flex-col gap-2 mt-2 w-full">
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={minNft}
          type="button"
        >
          🐶 {isPending ? 'Minting...' : 'Mint NFT'}
        </button>

        {error && (
          <p className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
            {(error as { details?: string })?.details ?? error?.message}
          </p>
        )}
        {data && (
          <a
            href={`https://testnet.sophscan.xyz/tx/${data}`}
            target="_blank"
            className="block text-sm bg-yellow-400/10 p-2 rounded-md border border-yellow-400 text-yellow-400 break-all my-2 w-full"
          >
            Tx hash: {data?.substring(0, 20)}...
            {data?.substring(data.length - 20)}
          </a>
        )}
      </div>
    </div>
  );
}

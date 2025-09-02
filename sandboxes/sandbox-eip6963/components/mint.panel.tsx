import { useWriteContract } from 'wagmi';
import { nftAbi } from '@/abi/nft';

export default function MintPanel() {
  const {
    data: writeContractData,
    error: writeContractErrorWagmi,
    writeContract,
    isPending: isSendingERC20,
  } = useWriteContract();

  const typedWriteContractData = writeContractData as string | undefined;

  const mint = () => {
    writeContract({
      address: '0xbc812793ddc7570b96A5b0A520eB0A6c07c06a6a', // MOCK NFT contract
      abi: nftAbi,
      functionName: 'claim',
      args: [0o000],
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full">
      <button
        className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
        onClick={mint}
        type="button"
      >
        🍀 {isSendingERC20 ? 'Minting...' : 'Mint NFT'}
      </button>
      {writeContractErrorWagmi && (
        <p className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          {(writeContractErrorWagmi as { details?: string })?.details ??
            writeContractErrorWagmi?.message}
        </p>
      )}
      {writeContractData && (
        <p className="text-sm text-gray-500">
          Minting Hash: {typedWriteContractData}
        </p>
      )}
    </div>
  );
}

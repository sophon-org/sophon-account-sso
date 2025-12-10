import { erc20Abi, parseUnits } from 'viem';
import { useWriteContract } from 'wagmi';

type WriteContractResponse = {
  id: string;
  requestId: string;
  content: {
    result: `0x${string}`;
  };
};

export default function TransactionERC20Panel() {
  const {
    data: writeContractData,
    error: writeContractErrorWagmi,
    writeContract,
    isPending: isSendingERC20,
  } = useWriteContract();

  const typedWriteContractData = writeContractData as
    | WriteContractResponse
    | undefined;

  const handleERC20Transfer = async () => {
    try {
      const hash = await writeContract({
        address: '0x8Ff37E04f354F3aEA341A9e64f803913aE3d853c', // Test Token contract
        abi: erc20Abi,
        functionName: 'transfer',
        args: [
          '0x0d94c4DBE58f6FE1566A7302b4E4C3cD03744626',
          parseUnits('1', 18),
        ],
      });
      console.log('Transaction hash:', hash);
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full">
      <button
        className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
        onClick={handleERC20Transfer}
        type="button"
      >
        {isSendingERC20 ? 'Sending...' : 'Send ERC20'}
      </button>
      {writeContractErrorWagmi && (
        <p className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          {(writeContractErrorWagmi as { details?: string })?.details ??
            writeContractErrorWagmi?.message}
        </p>
      )}
      {writeContractData && (
        <p className="text-sm text-gray-500">
          ERC20Transaction Hash: {typedWriteContractData?.content?.result}
        </p>
      )}
    </div>
  );
}

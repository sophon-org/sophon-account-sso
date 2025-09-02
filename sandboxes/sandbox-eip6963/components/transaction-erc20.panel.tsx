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

  const handleERC20Transfer = () => {
    writeContract({
      address: '0xE70a7d8563074D6510F550Ba547874C3C2a6F81F', // MOCK DAI contract
      abi: erc20Abi,
      functionName: 'transfer',
      args: [
        '0x0d94c4DBE58f6FE1566A7302b4E4C3cD03744626' as `0x${string}`,
        parseUnits('1', 18),
      ],
    });
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

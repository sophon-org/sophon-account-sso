import { useEffect, useState } from 'react';
import { erc20Abi, formatUnits, isAddress, parseEther, parseUnits } from 'viem';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';
import { useWriteContractWithPaymaster } from '../utils/useWriteContractWithPaymaster';

export default function TransactionNativePanel() {
  const { address } = useAccount();
  const [targetAddress, setTargetAddress] = useState<string>('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);
  const [txType, setTxType] = useState<
    'soph' | 'erc20' | 'approve' | undefined
  >(undefined);

  const [valueToSend, setValueToSend] = useState<number>(0.001);
  const { data: balance } = useBalance({
    address,
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (targetAddress === '') {
      setTargetAddress(address!);
    }
  }, [address, targetAddress]);

  const {
    data: transactionData,
    error: txErrorWagmi,
    sendTransaction,
    isPending: isSendingSoph,
  } = useSendTransaction();

  const {
    data: writeContractData,
    error: writeContractErrorWagmi,
    writeContract,
    isPending: isSendingERC20,
  } = useWriteContractWithPaymaster();

  const {
    data: approveContractData,
    error: approveContractError,
    writeContract: approveWriteContract,
    isPending: isSendingApprove,
  } = useWriteContractWithPaymaster();

  const handleSendSoph = () => {
    setError('');
    setTxType('soph');
    if (!targetAddress || !valueToSend) {
      setError('Please fill in all fields');
      return;
    }

    if (!isAddress(targetAddress)) {
      setError('Invalid target address');
      return;
    }

    const balanceValue = balance
      ? Number.parseFloat(formatUnits(balance.value, balance.decimals))
      : 0;

    if (valueToSend > balanceValue) {
      setError('Insufficient balance to execute transfer.');
      return;
    }

    sendTransaction({
      to: targetAddress,
      value: parseEther(valueToSend.toString()),
      data: '0x',
    });
  };

  const handleERC20Approve = () => {
    setTxType('approve');
    approveWriteContract({
      address: '0xE676a42fEd98d51336f02510bB5d598893AbfE90', // MOCK MintMe token
      abi: erc20Abi,
      functionName: 'approve',
      args: [
        targetAddress as `0x${string}`,
        parseUnits(valueToSend.toString(), 18),
      ],
    });
  };

  const handleERC20Transfer = () => {
    setTxType('erc20');
    writeContract({
      address: '0xE676a42fEd98d51336f02510bB5d598893AbfE90', // MOCK MintMe token
      abi: erc20Abi,
      functionName: 'transfer',
      args: [
        targetAddress as `0x${string}`,
        parseUnits(valueToSend.toString(), 18),
      ],
    });
  };

  useEffect(() => {
    if (transactionData || writeContractData || approveContractData) {
      setTxError(undefined);
      if (txType === 'soph') {
        setTxHash(transactionData);
      } else if (txType === 'erc20') {
        setTxHash(writeContractData);
      } else if (txType === 'approve') {
        setTxHash(approveContractData);
      }
    }
  }, [transactionData, writeContractData, approveContractData, txType]);

  useEffect(() => {
    setTxError(undefined);
    if (txErrorWagmi || writeContractErrorWagmi || approveContractError) {
      setTxHash(undefined);
      if (txType === 'soph') {
        setTxError(
          (txErrorWagmi as { details?: string })?.details ??
            txErrorWagmi?.message,
        );
      } else if (txType === 'erc20') {
        setTxError(
          (writeContractErrorWagmi as { details?: string })?.details ??
            writeContractErrorWagmi?.message,
        );
      } else if (txType === 'approve') {
        setTxError(
          (approveContractError as { details?: string })?.details ??
            approveContractError?.message,
        );
      }
    }
  }, [txErrorWagmi, writeContractErrorWagmi, approveContractError, txType]);

  return (
    <div>
      <h2 className="text-xl font-bold mt-4">Token Transactions</h2>
      <div className="flex flex-row gap-2 mt-4 w-full mb-4">
        {error && (
          <p className="text-sm  bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 flex-3">
          <label
            htmlFor="destination"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Destination
          </label>
          <input
            id="destination"
            type="text"
            placeholder="Target Address"
            className="p-2 rounded-md border border-gray-300"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label
            htmlFor="amount"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Amount
          </label>
          <input
            id="amount"
            type="number"
            placeholder="Value to Send"
            className="p-2 rounded-md border border-gray-300"
            value={valueToSend}
            onChange={(e) => setValueToSend(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={handleSendSoph}
          type="button"
        >
          💸 {isSendingSoph ? 'Sending...' : 'Send SOPH'}
        </button>
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={handleERC20Transfer}
          type="button"
        >
          💵 {isSendingERC20 ? 'Sending...' : 'Send DTN'}
        </button>
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={handleERC20Approve}
          type="button"
        >
          👍 {isSendingApprove ? 'Approving...' : 'Approve DTN'}
        </button>
      </div>
      {txError && (
        <p className="text-sm break-all bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center my-2">
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

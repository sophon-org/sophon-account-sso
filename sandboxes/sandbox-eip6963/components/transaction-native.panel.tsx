import { useState } from 'react';
import { formatUnits, isAddress, parseEther } from 'viem';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';

export default function TransactionNativePanel() {
  const { address } = useAccount();
  const [targetAddress, setTargetAddress] = useState<string>(
    '0xC988e0b689898c3D1528182F6917b765aB6C469A',
  );
  const [valueToSend, setValueToSend] = useState<number>(0.001);
  const { data: balance } = useBalance({
    address,
  });
  const [error, setError] = useState<string>('');

  const {
    data: transactionData,
    error: txErrorWagmi,
    sendTransaction,
    isPending: isSendingSoph,
  } = useSendTransaction();

  const handleSendSoph = () => {
    setError('');
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

  return (
    <div className="flex flex-col gap-2 mt-4 w-full">
      {error && (
        <p className="text-sm  bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          {error}
        </p>
      )}
      <input
        type="text"
        placeholder="Target Address"
        className="p-2 rounded-md border border-gray-300"
        value={targetAddress}
        onChange={(e) => setTargetAddress(e.target.value)}
      />
      <input
        type="number"
        placeholder="Value to Send"
        className="p-2 rounded-md border border-gray-300"
        value={valueToSend}
        onChange={(e) => setValueToSend(Number(e.target.value))}
      />
      <button
        className="bg-cyan-600 text-white p-2 rounded-md w-full hover:bg-cyan-700 hover:cursor-pointer border-1 border-black/40"
        onClick={handleSendSoph}
        type="button"
      >
        💸 {isSendingSoph ? 'Sending...' : 'Send SOPH'}
      </button>
      {txErrorWagmi && (
        <p className="text-sm  bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          {(txErrorWagmi as { details?: string })?.details ??
            txErrorWagmi?.message}
        </p>
      )}
      {transactionData && (
        <p className="text-sm text-gray-500">
          Native Token Tx: {transactionData}
        </p>
      )}
    </div>
  );
}

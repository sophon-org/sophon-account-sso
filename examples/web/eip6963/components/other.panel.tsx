import { useEffect, useState } from 'react';
import { unverifiedAbi } from '@/abi/unverified';
import { verifiedAbi } from '@/abi/verified';
import { useWriteContractWithPaymaster } from '../utils/useWriteContractWithPaymaster';

export default function UnverifiedPanel() {
  const [txType, setTxType] = useState<
    'unverified' | 'verified' | 'complex' | undefined
  >(undefined);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [txError, setTxError] = useState<string | undefined>(undefined);

  const {
    data: unverifiedData,
    error: unverifiedError,
    writeContract: unverifiedWriteContract,
    isPending: isUnverifiedPending,
  } = useWriteContractWithPaymaster();

  const {
    data: verifiedData,
    error: verifiedError,
    writeContract: verifiedWriteContract,
    isPending: isVerifiedPending,
  } = useWriteContractWithPaymaster();

  const {
    data: complexData,
    error: complexError,
    writeContract: complexWriteContract,
    isPending: isComplexPending,
  } = useWriteContractWithPaymaster();

  const doUnverifiedTransaction = () => {
    setTxType('unverified');
    unverifiedWriteContract({
      address: '0x0c76828A43556cAA48Fa687e540E6a76155d6850', // Some unverified contract
      abi: unverifiedAbi,
      functionName: 'setAll',
      args: ['anything', 100],
    });
  };

  const doVerifiedTransaction = async () => {
    setTxType('verified');

    verifiedWriteContract({
      address: '0xC0830ABFe9Ab55b476456f7cA13103c666be5502', // Some Verified contract
      abi: verifiedAbi,
      functionName: 'setString',
      args: ['Hello World'],
    });
  };

  const doComplexTransaction = () => {
    setTxType('complex');

    const struct = {
      testString: 'Hello World',
      testNumber: 0o020,
      testAddress: '0x0000000000000000000000000000000000000000',
      testBool: true,
    };

    complexWriteContract({
      address: '0xC0830ABFe9Ab55b476456f7cA13103c666be5502', // Some Verified contract
      abi: verifiedAbi,
      functionName: 'setStruct',
      args: ['another string', struct],
    });
  };

  useEffect(() => {
    if (unverifiedData || verifiedData || complexData) {
      setTxError(undefined);
      if (txType === 'unverified') {
        setTxHash(unverifiedData);
      } else if (txType === 'verified') {
        setTxHash(verifiedData);
      } else if (txType === 'complex') {
        setTxHash(complexData);
      }
    }
  }, [unverifiedData, verifiedData, complexData, txType]);

  useEffect(() => {
    if (unverifiedError || verifiedError || complexError) {
      setTxHash(undefined);
      if (txType === 'unverified') {
        setTxError(
          (unverifiedError as { details?: string })?.details ??
            unverifiedError?.message,
        );
      } else if (txType === 'verified') {
        setTxError(
          (verifiedError as { details?: string })?.details ??
            verifiedError?.message,
        );
      } else if (txType === 'complex') {
        setTxError(
          (complexError as { details?: string })?.details ??
            complexError?.message,
        );
      }
    }
  }, [unverifiedError, verifiedError, complexError, txType]);

  return (
    <div>
      <h2 className="text-xl font-bold mt-4">Other contracts</h2>
      <div className="flex flex-col gap-2 mt-2 w-full">
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={doUnverifiedTransaction}
          type="button"
        >
          ❌ {isUnverifiedPending ? 'Sending...' : 'Unverified contract'}
        </button>

        <div className="flex flex-row gap-2 mt-2 w-full">
          <button
            className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
            onClick={doVerifiedTransaction}
            type="button"
          >
            ✅ {isVerifiedPending ? 'Sending...' : 'Verified'}
          </button>
          <button
            className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
            onClick={doComplexTransaction}
            type="button"
          >
            ✅ {isComplexPending ? 'Sending...' : 'Verified (complex args)'}
          </button>
        </div>
      </div>
      {txError && (
        <p className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center break-all mt-4">
          {txError}
        </p>
      )}
      {txHash && (
        <a
          href={`https://testnet.sophscan.xyz/tx/${txHash}`}
          target="_blank"
          className="block text-sm bg-yellow-400/10 p-2 rounded-md border border-yellow-400 text-yellow-400 break-all my-2 w-full mt-4"
        >
          Tx hash: {txHash?.substring(0, 20)}...
          {txHash?.substring(txHash.length - 20)}
        </a>
      )}
    </div>
  );
}

import { IconSignature } from '@/components/icons/icon-signature';
import { Loader } from '@/components/loader';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { useTransactionRequestActions } from '@/hooks/actions/useTransactionRequestActions';
import { truncateName } from '@/lib/formatting';
import { TransactionType } from '@/types/auth';

export default function TransactionRequestView() {
  const {
    incomingRequest,
    transactionRequest,
    enrichedTransactionRequest,
    isLoading,
  } = useTransactionRequestActions();

  if (!transactionRequest || !incomingRequest) {
    return <div>No transaction request present</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8">
      <VerificationImage icon={<IconSignature className="w-24 h-24" />} />
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-2xl font-bold">Transaction request</h5>
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>
      <MessageContainer>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 w-full h-full">
            <Loader className="w-8 h-8 border-white border-r-transparent" />
          </div>
        ) : enrichedTransactionRequest?.transactionType ===
          TransactionType.SOPH ? (
          // SOPH transaction display
          <div className="text-sm text-black flex flex-col gap-1">
            <p className="text-xs font-bold">From:</p>
            <p className="text-sm text-black font-mono break-all">
              {enrichedTransactionRequest?.from}
            </p>
            <p className="text-xs font-bold">To:</p>
            <p className="text-sm font-mono break-all text-black">
              {enrichedTransactionRequest?.recipient}
            </p>
            <p className="text-xs font-bold">Token:</p>
            <p className="text-sm text-black">
              {enrichedTransactionRequest?.token?.symbol}
            </p>
            <p className="text-xs font-bold">Amount:</p>
            <p className="text-sm text-black">
              {enrichedTransactionRequest?.displayValue}
            </p>
          </div>
        ) : enrichedTransactionRequest?.transactionType ===
          TransactionType.ERC20 ? (
          // ERC20 transaction display
          <div className="text-sm text-black flex flex-col gap-1">
            <p className="text-xs font-bold">From:</p>
            <p className="text-sm text-black font-mono break-all">
              {enrichedTransactionRequest?.from}
            </p>
            <p className="text-xs font-bold">To:</p>
            <p className="text-sm font-mono break-all text-black">
              {enrichedTransactionRequest?.recipient}
            </p>
            <p className="text-xs font-bold">Token:</p>
            <p className="text-sm text-black">
              {enrichedTransactionRequest?.token?.symbol}
            </p>
            <p className="text-xs font-bold">Amount:</p>
            <p className="text-sm text-black">
              {enrichedTransactionRequest?.displayValue}
            </p>
          </div>
        ) : enrichedTransactionRequest?.transactionType ===
          TransactionType.CONTRACT ? (
          // Contract transaction display
          // Contract transaction display
          <div className="text-sm text-black flex flex-col gap-3">
            <div className="text-left">
              <p className="text-sm font-bold">Interacting with:</p>
              <p className="text-sm text-black">
                <span className="font-bold truncate block">
                  {truncateName(enrichedTransactionRequest?.contractName || '')}
                </span>{' '}
                @{' '}
                <span className="font-mono">
                  {enrichedTransactionRequest?.recipient?.slice(0, 6)}...
                  {enrichedTransactionRequest?.recipient?.slice(-6)}
                </span>
              </p>
            </div>

            <div>
              <p className="text-sm font-bold">
                Executing "
                {enrichedTransactionRequest?.decodedData?.functionName ||
                  'Unknown'}
                " with parameters
              </p>
              {enrichedTransactionRequest?.decodedData?.args?.map((arg) => (
                <div key={arg.name} className="text-sm text-black">
                  <p className="font-mono">
                    {arg.name}: {arg.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-left">
              <p className="text-sm text-black">
                You are sending {enrichedTransactionRequest?.displayValue} SOPH
                for this transaction to the contract above.
              </p>
            </div>
          </div>
        ) : (
          // Default case for unknown transaction types
          <div className="text-sm text-black">
            <p>Unknown transaction type</p>
          </div>
        )}
      </MessageContainer>
    </div>
  );
}

// Export the actions hook for the root component to use
TransactionRequestView.useActions = useTransactionRequestActions;

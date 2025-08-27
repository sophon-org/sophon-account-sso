import {
  ApprovalTransactionView,
  ContractTransactionView,
  ContractWarning,
  ERC20TransactionView,
  SOPHTransactionView,
  TransactionIcon,
  TransactionRequestSkeleton,
  TransactionTitle,
} from '@/components/transaction-views';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { useTransactionRequestActions } from '@/hooks/actions/useTransactionRequestActions';
import type { EnrichedTransactionRequest } from '@/types/auth';
import { TransactionType } from '@/types/auth';

function renderTransactionContent(transaction: EnrichedTransactionRequest) {
  switch (transaction.transactionType) {
    case TransactionType.SOPH:
      return <SOPHTransactionView transaction={transaction} />;
    case TransactionType.ERC20:
      return <ERC20TransactionView transaction={transaction} />;
    case TransactionType.APPROVE:
      return <ApprovalTransactionView transaction={transaction} />;
    case TransactionType.CONTRACT:
      return <ContractTransactionView transaction={transaction} />;
    default:
      return (
        <div className="text-sm text-black">
          <p>Unknown transaction type</p>
        </div>
      );
  }
}

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

  if (isLoading || !enrichedTransactionRequest) {
    return <TransactionRequestSkeleton />;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center gap-8">
      <VerificationImage
        icon={<TransactionIcon transaction={enrichedTransactionRequest} />}
      />
      <div className="flex flex-col items-center justify-center">
        <TransactionTitle transaction={enrichedTransactionRequest} />
        <p className="hidden">https://my.staging.sophon.xyz</p>
      </div>

      <div className="w-full">
        <ContractWarning transaction={enrichedTransactionRequest} />
        <MessageContainer>
          {renderTransactionContent(enrichedTransactionRequest)}
        </MessageContainer>
      </div>
    </div>
  );
}

TransactionRequestView.useActions = useTransactionRequestActions;

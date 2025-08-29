import {
  ApprovalTransactionView,
  ContractTransactionView,
  ContractWarning,
  ERC20TransactionView,
  NewSignerTransactionView,
  SOPHTransactionView,
  TransactionIcon,
  TransactionRequestSkeleton,
  TransactionTitle,
} from '@/components/transaction-views';
import MessageContainerButton from '@/components/ui/message-container-button';
import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';
import { useTransactionRequestActions } from '@/hooks/actions/useTransactionRequestActions';
import type { EnrichedTransactionRequest } from '@/types/auth';
import { TransactionType } from '@/types/auth';

type DrawerContentType = 'raw-transaction' | 'fee-details' | 'error' | null;

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
    case TransactionType.SIGNER:
      return <NewSignerTransactionView transaction={transaction} />;
    default:
      return (
        <div className="text-sm text-black">
          <p>Unknown transaction type</p>
        </div>
      );
  }
}

interface TransactionRequestViewProps {
  openDrawer?: (type: DrawerContentType, data?: string | object) => void;
}

export default function TransactionRequestView({
  openDrawer,
}: TransactionRequestViewProps = {}) {
  const {
    incomingRequest,
    transactionRequest,
    enrichedTransactionRequest,
    isLoading,
  } = useTransactionRequestActions({ openDrawer });

  if (!transactionRequest || !incomingRequest) {
    return <div>No transaction request present</div>;
  }

  if (isLoading || !enrichedTransactionRequest) {
    return <TransactionRequestSkeleton />;
  }

  return (
    <BaseTransactionRequestView
      openDrawer={openDrawer}
      enrichedTransactionRequest={enrichedTransactionRequest}
    />
  );
}

export function BaseTransactionRequestView({
  openDrawer,
  enrichedTransactionRequest,
}: TransactionRequestViewProps & {
  enrichedTransactionRequest: EnrichedTransactionRequest;
}) {
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
        <MessageContainer showBottomButton={!!openDrawer}>
          {renderTransactionContent(enrichedTransactionRequest)}
          {openDrawer && (
            <MessageContainerButton
              onClick={() => openDrawer('raw-transaction')}
            >
              View raw transaction details
            </MessageContainerButton>
          )}
        </MessageContainer>
      </div>
    </div>
  );
}

TransactionRequestView.useActions = useTransactionRequestActions;

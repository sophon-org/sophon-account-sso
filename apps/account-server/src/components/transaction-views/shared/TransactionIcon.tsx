import { CoinsIcon, ReceiptIcon } from '@phosphor-icons/react';
import TokenIcon from '@/components/ui/token-icon';
import { type EnrichedTransactionRequest, TransactionType } from '@/types/auth';

interface TransactionIconProps {
  transaction: EnrichedTransactionRequest;
}

export default function TransactionIcon({ transaction }: TransactionIconProps) {
  // For transactions with tokens, show the token icon if available
  if ('token' in transaction && transaction.token?.iconURL) {
    return (
      <TokenIcon
        iconURL={transaction.token.iconURL}
        alt={transaction.token.tokenName || ''}
      />
    );
  }

  // Fall back to transaction type-specific icons
  switch (transaction.transactionType) {
    case TransactionType.APPROVE:
    case TransactionType.ERC20:
      return <CoinsIcon weight="fill" className="w-10 h-10 text-white" />;
    default:
      return <ReceiptIcon weight="fill" className="w-10 h-10 text-white" />;
  }
}

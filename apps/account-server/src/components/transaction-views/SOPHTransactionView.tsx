import type { EnrichedSOPHTransaction } from '@/types/auth';
import { RecipientDetails, TokenDetails, TransactionAmount } from './shared';

interface SOPHTransactionViewProps {
  transaction: EnrichedSOPHTransaction;
}

export default function SOPHTransactionView({
  transaction,
}: SOPHTransactionViewProps) {
  return (
    <div className="text-sm text-black flex flex-col gap-1">
      <TokenDetails token={transaction.token} />
      <RecipientDetails recipient={transaction.recipient} />
      <TransactionAmount
        amount={transaction.displayValue}
        symbol={transaction.token.symbol}
      />
    </div>
  );
}

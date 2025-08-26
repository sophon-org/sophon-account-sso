import type { EnrichedERC20Transaction } from '@/types/auth';
import { RecipientDetails, TokenDetails, TransactionAmount } from './shared';

interface ERC20TransactionViewProps {
  transaction: EnrichedERC20Transaction;
}

export default function ERC20TransactionView({
  transaction,
}: ERC20TransactionViewProps) {
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

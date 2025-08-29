import { type EnrichedTransactionRequest, TransactionType } from '@/types/auth';

interface TransactionTitleProps {
  transaction: EnrichedTransactionRequest;
}

export default function TransactionTitle({
  transaction,
}: TransactionTitleProps) {
  switch (transaction.transactionType) {
    case TransactionType.SOPH:
      return (
        <h5 className="text-2xl font-bold">
          Transfer {'token' in transaction ? transaction.token.symbol : 'SOPH'}
        </h5>
      );

    case TransactionType.ERC20:
      return (
        <h5 className="text-2xl font-bold">
          Transfer {'token' in transaction ? transaction.token.symbol : 'Token'}
        </h5>
      );

    case TransactionType.APPROVE:
      return (
        <h5 className="text-2xl font-bold">
          Spending request for{' '}
          {'token' in transaction ? transaction.token.symbol : 'Token'}
        </h5>
      );

    case TransactionType.CONTRACT:
      return <h5 className="text-2xl font-bold">Transaction request</h5>;

    case TransactionType.SIGNER:
      return <h5 className="text-2xl font-bold">Add signer</h5>;

    default:
      return <h5 className="text-2xl font-bold">Unknown transaction</h5>;
  }
}

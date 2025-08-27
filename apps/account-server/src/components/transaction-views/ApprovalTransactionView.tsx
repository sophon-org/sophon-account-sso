import { truncateName } from '@/lib/formatting';
import type { EnrichedApprovalTransaction } from '@/types/auth';
import { AddressLink } from './shared';

interface ApprovalTransactionViewProps {
  transaction: EnrichedApprovalTransaction;
}

export default function ApprovalTransactionView({
  transaction,
}: ApprovalTransactionViewProps) {
  return (
    <div className="text-sm text-black flex flex-col gap-4">
      <div className="text-left flex flex-col gap-1">
        <p className="text-xs font-bold">Contract:</p>
        <p className="text-sm text-black">
          <span className="">
            {truncateName(transaction.spender.name || '')}
          </span>{' '}
          @ <AddressLink address={transaction.spender.address} />
        </p>
      </div>

      <div className="text-left flex flex-col gap-1">
        <p className="text-xs font-bold">Token:</p>
        <p className="text-sm text-black">
          <span className="">
            {truncateName(transaction.token.tokenName || '')}
          </span>{' '}
          @ <AddressLink address={transaction.token.contractAddress} />
        </p>
      </div>

      <div className="text-left flex flex-col gap-1">
        <p className="text-xs font-bold">Spending cap:</p>
        <p className="text-sm text-black">
          {transaction.spender.spendingCap} {transaction.token.symbol}
        </p>
      </div>

      <div className="text-left flex flex-col gap-1">
        <p className="text-xs font-bold">Current balance:</p>
        <p className="text-sm text-black">
          {transaction.token.currentBalance} {transaction.token.symbol}
        </p>
      </div>
    </div>
  );
}

import { InfoIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { type EnrichedTransactionRequest, TransactionType } from '@/types/auth';

interface ContractWarningProps {
  transaction: EnrichedTransactionRequest;
}

export default function ContractWarning({ transaction }: ContractWarningProps) {
  if (transaction.transactionType === TransactionType.APPROVE) {
    return (
      <Card elevated className="py-4 px-6 flex items-center gap-4 w-full">
        <InfoIcon weight="fill" className="w-6 h-6 text-[#A3A2A0]" />
        <p className="text-xs text-black flex-1 text-left max-w-[264px]">
          You will give permission to the following address to spend tokens on
          your behalf
        </p>
      </Card>
    );
  }

  if (transaction.transactionType === TransactionType.CONTRACT) {
    if (transaction.isVerified) {
      return null;
    }

    return (
      <Card elevated className="py-4 px-6 flex items-center gap-4 w-full">
        <WarningCircleIcon weight="fill" className="w-6 h-6 text-red-500" />
        <p className="text-xs text-black flex-1 text-left max-w-[264px]">
          This contract is not verified, and for this reason it is not possible
          to show the transaction details. Make sure you trust it before
          proceeding.
        </p>
      </Card>
    );
  }
}

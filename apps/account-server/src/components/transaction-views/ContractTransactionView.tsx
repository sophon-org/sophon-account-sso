import { truncateContractName } from '@/lib/formatting';
import type { EnrichedContractTransaction } from '@/types/auth';
import { AddressLink, renderParameterValue } from './shared';

interface ContractTransactionViewProps {
  transaction: EnrichedContractTransaction;
}

export default function ContractTransactionView({
  transaction,
}: ContractTransactionViewProps) {
  return (
    <div className="text-sm text-black flex flex-col gap-4">
      <div className="text-left flex flex-col gap-1">
        <p className="text-sm font-bold">Interacting with:</p>
        <p className="text-sm text-black">
          <span>{truncateContractName(transaction.contractName || '')}</span> @{' '}
          <AddressLink address={transaction.recipient} />
        </p>
      </div>

      {transaction.isVerified && transaction.decodedData && (
        <div>
          <p className="text-sm font-bold">
            Executing "{transaction.decodedData.functionName || 'Unknown'}"
            <span className="font-normal"> with parameters:</span>
          </p>
          {transaction.decodedData.args.map((arg) => (
            <div key={arg.name} className="text-sm text-black mb-2">
              <div className="flex items-start">
                <span className="mr-1">{'\u2022'}</span>
                <div className="flex-1">
                  <span className="font-bold">{arg.name}:</span>{' '}
                  {renderParameterValue(arg)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {transaction.displayValue !== '0' && (
        <div className="text-left">
          <p className="text-sm text-black">
            You are sending{' '}
            <span className="font-bold">{transaction.displayValue} SOPH</span>{' '}
            for this transaction to the contract above.
          </p>
        </div>
      )}
    </div>
  );
}

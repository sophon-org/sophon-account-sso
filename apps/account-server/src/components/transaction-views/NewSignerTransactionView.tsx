import { toHex } from 'viem';
import { base64UrlToUint8Array } from 'zksync-sso/utils';
import { getSignerDisplayLabel } from '@/lib/signers';
import type { EnrichedSignerTransaction } from '@/types/auth';
import { AccountType, type PasskeySigner } from '@/types/smart-account';

interface NewSignerTransactionViewProps {
  transaction: EnrichedSignerTransaction;
}

export default function NewSignerTransactionView({
  transaction,
}: NewSignerTransactionViewProps) {
  const signer = transaction.signer;

  const renderInformation = () => {
    switch (signer.accountType) {
      case AccountType.PASSKEY:
        return (
          <div className="text-left flex flex-col gap-1">
            <p className="text-base font-bold">Information</p>

            <div className="text-sm text-black">
              <div className="flex items-start">
                <span className="mr-1">{'\u2022'}</span>
                <div className="flex-1">
                  <span className="font-bold">Name:</span>{' '}
                  {(signer as PasskeySigner).username}
                </div>
              </div>
            </div>
            <div className="text-sm text-black">
              <div className="flex items-start">
                <span className="mr-1">{'\u2022'}</span>
                <div className="flex-1">
                  <span className="font-bold">Id:</span>{' '}
                  {toHex(
                    base64UrlToUint8Array(
                      (signer as PasskeySigner).credential.id,
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="text-sm text-black flex flex-col gap-4">
      <div className="text-left flex flex-col gap-1">
        <p className="text-base font-bold">Type</p>
        <p className="text-sm text-black">
          <span className="truncate block">
            {getSignerDisplayLabel(signer)}
          </span>
        </p>
      </div>

      {renderInformation()}
    </div>
  );
}

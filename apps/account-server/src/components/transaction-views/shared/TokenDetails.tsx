import { truncateName } from '@/lib/formatting';
import type { Token } from '@/types/auth';
import AddressLink from './AddressLink';

interface TokenDetailsProps {
  token: Token;
}

export default function TokenDetails({ token }: TokenDetailsProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-bold">Token:</p>
      <p className="text-sm text-black">
        <span className="">{truncateName(token.tokenName || '')}</span> @{' '}
        <AddressLink address={token.contractAddress} />
      </p>
    </div>
  );
}

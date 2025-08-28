import { BLOCK_EXPLORER_URL } from '@/lib/constants';

interface AddressLinkProps {
  address: string;
  className?: string;
}

export default function AddressLink({ address, className }: AddressLinkProps) {
  return (
    <a
      href={`${BLOCK_EXPLORER_URL}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:underline ${className || ''}`}
    >
      {address.slice(0, 6)}...{address.slice(-6)}
      <span className="text-sm underline ml-0.5">{'\u2197'}</span>
    </a>
  );
}

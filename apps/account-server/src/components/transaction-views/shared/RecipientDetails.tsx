import AddressLink from './AddressLink';

interface RecipientDetailsProps {
  recipient: string;
}

export default function RecipientDetails({ recipient }: RecipientDetailsProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-bold">To:</p>
      <p className="text-sm break-all text-black">
        <AddressLink address={recipient} />
      </p>
    </div>
  );
}

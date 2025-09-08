interface TransactionAmountProps {
  amount: string;
  symbol: string;
  label?: string;
}

export default function TransactionAmount({
  amount,
  symbol,
  label = 'Amount',
}: TransactionAmountProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-bold">{label}:</p>
      <p className="text-sm text-black">
        {amount} {symbol}
      </p>
    </div>
  );
}

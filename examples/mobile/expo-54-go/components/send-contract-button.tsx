import { useSophonClient } from '@sophon-labs/account-react-native';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/ui/button';

interface SendContractProps {
  title: string;
  transactionParams: any;
}

export const SendContractButton = ({
  title,
  transactionParams,
}: SendContractProps) => {
  const { walletClient } = useSophonClient();
  const [error, setError] = useState<string>('');
  const [transaction, setTransaction] = useState<string>();

  return (
    <>
      {!!error && (
        <Text className="text-sm mt-2 text-red-500 max-w-[80%]">{error}</Text>
      )}
      <Button
        className="mt-4 bg-purple-500/90 w-full max-w-[80%]"
        onPress={async () => {
          try {
            setError('');
            const tx = await walletClient!.writeContract(transactionParams);
            setTransaction(tx);
          } catch (e: any) {
            setError(e.details ?? e.message);
          }
        }}
      >
        <Text className="text-xl font-bold text-white">{title}</Text>
      </Button>

      {transaction && (
        <Text className="text-xs my-4 text-black max-w-[80%]">
          {transaction ?? 'N/A'}
        </Text>
      )}
    </>
  );
};

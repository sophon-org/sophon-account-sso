import { sophonOSTestnet } from '@sophon-labs/account-core';
import { useSophonAccount } from '@sophon-labs/account-react-native';
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { type Address, erc20Abi, parseEther, parseUnits } from 'viem';
import { Button } from './ui/button';
import { CardAction } from './ui/card-action';

interface State {
  address: Address | undefined;
  amount: string;
}

export function TokenTransaction() {
  const { account, walletClient } = useSophonAccount();
  const [transaction, setTransaction] = React.useState<string>();
  const [error, setError] = React.useState<string | null>(null);
  const [{ address, amount }, setState] = React.useState<State>({
    address: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
    amount: '0.01',
  });

  const onValidationInputs = () => {
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      setError('Please enter a valid address (0x...)');
      return;
    }
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    return true;
  };

  const handleOnSendSophon = async () => {
    try {
      setError('');
      // if (!balance || balance.value < parseEther(amount)) {
      //   setError("Insufficient balance to execute transfer.");
      //   return;
      // }
      // if (!onValidationInputs()) return;
      const tx = await walletClient!.sendTransaction({
        to: address,
        value: parseEther(amount),
        data: '0x',
        account: account!.address,
        chain: sophonOSTestnet,
      });
      setTransaction(tx);
    } catch (e: any) {
      setError?.(e.details ?? e.message);
    }
  };

  const handleOnWriteContract = async (
    functionName: 'approve' | 'transfer',
  ) => {
    try {
      setError('');
      if (!onValidationInputs()) return;
      const tx = await walletClient!.writeContract({
        address: '0xE676a42fEd98d51336f02510bB5d598893AbfE90',
        abi: erc20Abi,
        functionName,
        args: [address as Address, parseUnits(amount, 18)],
        account: account!.address,
        chain: sophonOSTestnet,
      });
      setTransaction(tx);
    } catch (e: any) {
      setError?.(e.details ?? e.message);
    }
  };

  return (
    <View className="gap-8 w-full max-w-[80%] my-4 border-t py-8 border-b">
      <Text className="text-xl font-bold text-black">Token Transactions</Text>
      <View className="gap-2">
        <Text className="text font-bold text-black">Destination</Text>
        <TextInput
          placeholder="Target Address"
          value={address}
          className="border border-grey-500 p-2 py-3 w-full"
          style={{ borderRadius: 4, borderColor: '#a8a8a8' }}
          collapsable
          onChangeText={(text) =>
            setState((values) => ({ ...values, address: text as Address }))
          }
        />
        <Text className="text font-bold text-black">Amount</Text>
        <TextInput
          placeholder="Amount"
          value={amount}
          keyboardType="decimal-pad"
          className="border border-grey-500 p-2 py-3 w-full"
          style={{ borderRadius: 4, borderColor: '#a8a8a8' }}
          onChangeText={(text) => {
            const normalizedText = text.replace(/,/g, '.');
            const cleaned = normalizedText.replace(/[^0-9.]/g, '');
            const parts = cleaned.split('.');
            const formatted =
              parts.length > 2
                ? `${parts[0]}.${parts.slice(1).join('')}`
                : cleaned;
            setState((values) => ({ ...values, amount: formatted }));
          }}
        />
        <CardAction
          message={error}
          onPressClear={() => setError(null)}
          type="error"
        />
      </View>

      <CardAction
        message={transaction}
        onPressClear={() => setTransaction('')}
        type="success"
      />

      <View className="gap-4 items-center">
        <Button
          className="bg-purple-500/90 w-full"
          onPress={handleOnSendSophon}
        >
          <Text className="text-xl font-bold text-white">👑 Send SOPH</Text>
        </Button>
        <View className="flex-row justify-between w-full gap-4">
          <Button
            className="bg-purple-500/90"
            onPress={() => handleOnWriteContract('transfer')}
          >
            <Text className="font-bold text-white">💵 Send DTN</Text>
          </Button>
          <Button
            className="bg-purple-500/90 "
            onPress={() => handleOnWriteContract('approve')}
          >
            <Text className="font-bold text-white">👍 Approve DTN</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

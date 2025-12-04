import { shortenAddress } from '@sophon-labs/account-core';
import { useSophonAccount } from '@sophon-labs/account-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { useBalance } from 'wagmi';

export function UserBalance() {
  const { account } = useSophonAccount();
  const { data: balance } = useBalance({
    address: account?.address,
  });
  return (
    <View className="py-2 w-full max-w-[80%] my-4">
      <Text className="text-xl font-bold text-center">Balance</Text>
      <View className="flex-row justify-between mt-2">
        <Text className="text-lg text-black font-bold">User:</Text>
        <Text className="text-lg text-black">
          {shortenAddress(account?.address)}
        </Text>
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="text-lg text-black font-bold">Soph:</Text>
        <Text className="text-lg text-black">{balance?.value ?? 0}</Text>
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="text-lg text-black font-bold">
          DTN Token (For test):
        </Text>
        <Text className="text-lg text-black">{0}</Text>
      </View>
    </View>
  );
}

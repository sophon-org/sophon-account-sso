import { shortenAddress } from '@sophon-labs/account-core';
import { useSophonToken } from '@sophon-labs/account-react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from './ui/button';

export default function JWTPanel() {
  const { getAccessToken, getMe } = useSophonToken();
  const [me, setMe] = useState<`0x${string}` | null>(null);
  const token = useMemo(() => {
    return getAccessToken(false, 'http://localhost:4001');
  }, [getAccessToken]);

  const fetchMe = async () => {
    const me = await getMe('http://localhost:4001');
    setMe(me.sub as `0x${string}`);
  };

  const refreshMe = () => {
    getAccessToken(true, 'http://localhost:4001');
  };

  return (
    <View className="flex flex-col gap-2 mt-2 w-full">
      <Text className="text-xl font-bold mt-4">Me / JWT</Text>
      {token && (
        <Text className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          Token: {shortenAddress(token.value as `0x${string}`)}
        </Text>
      )}
      {me && (
        <Text className="text-sm bg-red-400/10 p-2 mt-2 rounded-md border border-red-400 text-red-400 text-center">
          Me: {shortenAddress(me)}
        </Text>
      )}
      <View className="flex flex-row gap-2 mt-2 w-full">
        <Button
          className="bg-purple-400 text-white p-2 rounded-md hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40 w-1/2"
          onPress={fetchMe}
        >
          <Text>Fetch Me</Text>
        </Button>
        <Button
          className="bg-purple-400 text-white p-2 rounded-md hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40 w-1/2"
          onPress={refreshMe}
        >
          <Text>Refresh Me</Text>
        </Button>
      </View>
    </View>
  );
}

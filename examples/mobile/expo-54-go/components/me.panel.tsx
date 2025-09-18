import { shortenAddress } from '@sophon-labs/account-core';
import {
  type SophonJWTToken,
  useSophonToken,
} from '@sophon-labs/account-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from './ui/button';

export default function JWTPanel() {
  const { getAccessToken, getMe } = useSophonToken();
  const [me, setMe] = useState<`0x${string}` | null>(null);
  const [token, setToken] = useState<SophonJWTToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMe, setLoadingMe] = useState(false);

  const updateAccessToken = useCallback(async () => {
    setLoading(true);
    const newToken = await getAccessToken();
    setToken(newToken);
    setLoading(false);
  }, [getAccessToken]);

  useEffect(() => {
    updateAccessToken();
  }, []);

  const fetchMe = async () => {
    setLoadingMe(true);
    const me = await getMe();
    setMe(me.sub as `0x${string}`);
    setLoadingMe(false);
  };

  const getToken = async () => {
    setLoading(true);
    const accessToken = await getAccessToken();
    setToken(accessToken);
    setLoading(false);
  };

  const refreshMe = async () => {
    setLoading(true);
    const newToken = await getAccessToken(true);
    setToken(newToken);
    setLoading(false);
  };

  return (
    <View className="flex flex-col gap-2 mt-2 w-full">
      <Text className="text-xl font-bold mt-4">Me / JWT</Text>
      {token && (
        <Text className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          Token:{' '}
          {loading
            ? 'Loading...'
            : shortenAddress(token.value as `0x${string}`)}
        </Text>
      )}
      {me && (
        <Text className="text-sm bg-red-400/10 p-2 mt-2 rounded-md border border-red-400 text-red-400 text-center">
          Me: {loadingMe ? 'Loading...' : shortenAddress(me)}
        </Text>
      )}
      <View className="flex flex-row gap-2 mt-2 w-full">
        <Button
          className="bg-purple-400 text-white p-2 rounded-md hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40 w-1/3"
          onPress={fetchMe}
        >
          <Text>Fetch Me</Text>
        </Button>
        <Button
          className="bg-purple-400 text-white p-2 rounded-md hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40 w-1/3"
          onPress={getToken}
        >
          <Text>Get Token</Text>
        </Button>
        <Button
          className="bg-purple-400 text-white p-2 rounded-md hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40 w-1/3"
          onPress={refreshMe}
        >
          <Text>Refresh Me</Text>
        </Button>
      </View>
    </View>
  );
}

import { shortenAddress } from '@sophon-labs/account-core';
import { useSophonToken } from '@sophon-labs/account-react';
import { useMemo, useState } from 'react';

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
    <div>
      <h2 className="text-xl font-bold mt-4">Me / JWT</h2>
      {token && (
        <p className="text-sm bg-red-400/10 p-2 rounded-md border border-red-400 text-red-400 text-center">
          Token: {shortenAddress(token.value as `0x${string}`)}
        </p>
      )}
      {me && (
        <p className="text-sm bg-red-400/10 p-2 mt-2 rounded-md border border-red-400 text-red-400 text-center">
          Me: {shortenAddress(me)}
        </p>
      )}
      <div className="flex flex-row gap-2 mt-2 w-full">
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={fetchMe}
          type="button"
        >
          'Fetch Me'
        </button>
        <button
          className="bg-purple-400 text-white p-2 rounded-md w-full hover:bg-purple-500 hover:cursor-pointer border-1 border-black/40"
          onClick={refreshMe}
          type="button"
        >
          'Refresh Me'
        </button>
      </div>
    </div>
  );
}

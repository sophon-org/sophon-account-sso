import { snsManager } from '@sophon-labs/account-core';
import { useEffect, useMemo, useState } from 'react';
import { SophonAppStorage } from '../provider';
import { useSophonContext } from './use-sophon-context';

export const useSophonName = () => {
  const { account, chainId } = useSophonContext();
  const sns = useMemo(() => snsManager(chainId, SophonAppStorage), [chainId]);
  const [userName, setUserName] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      if (!account?.address) {
        setUserName(null);
        return;
      }

      const name = await sns.fetchSNSName(account.address);
      setUserName(name);
    })();
  }, [account?.address, sns]);

  return userName;
};

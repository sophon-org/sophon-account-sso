import {
  type SNSName,
  shortenAddress,
  snsCache,
} from '@sophon-labs/account-core';
import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { sophonTestnet } from 'viem/chains';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';

export const useAddressWithSns = (
  address?: Address,
  shortAddress?: boolean,
) => {
  const [isChecking, setIsChecking] = useState(false);

  const [addressOrName, setAddressOrName] = useState<string | undefined>(
    undefined,
  );

  const cache = snsCache(SOPHON_VIEM_CHAIN.id === sophonTestnet.id);

  // biome-ignore lint/correctness/useExhaustiveDependencies: If I add, it complains the function changes on every render
  useEffect(() => {
    if (address && !addressOrName) {
      const cachedName = cache.getCachedSNSName(address!);

      if (cachedName) {
        setAddressOrName(cachedName);
        return;
      } else if (shortAddress) {
        setAddressOrName(shortenAddress(address));
      } else {
        setAddressOrName(address);
      }
      tryToResolveAddress();
    }
  }, [address, addressOrName]);

  const tryToResolveAddress = async () => {
    setIsChecking(true);
    const result = await cache.fetchSNSName(address!);
    if (result) {
      setAddressOrName(result as SNSName);
    }
    setIsChecking(false);
  };

  return {
    tryToResolveAddress,
    addressOrName,
    isChecking,
  };
};

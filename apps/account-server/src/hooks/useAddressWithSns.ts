'use client';

import {
  type SNSName,
  shortenAddress,
  snsManager,
} from '@sophon-labs/account-core';
import { useCallback, useEffect, useState } from 'react';
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

  const sns = snsManager(SOPHON_VIEM_CHAIN.id === sophonTestnet.id);

  const tryToResolveAddress = async () => {
    setIsChecking(true);
    const result = await sns.fetchSNSName(address!);
    if (result) {
      setAddressOrName(result as SNSName);
    }
    setIsChecking(false);
  };

  const cachedTryToResolveAddress = useCallback(tryToResolveAddress, []);

  useEffect(() => {
    if (address) {
      const cachedName = sns.getCachedSNSName(address);

      if (cachedName) {
        setAddressOrName(cachedName);
        return;
      } else if (shortAddress) {
        setAddressOrName(shortenAddress(address));
      } else {
        setAddressOrName(address);
      }
      cachedTryToResolveAddress();
    } else {
      // Reset when no address is provided
      setAddressOrName(undefined);
    }
  }, [address, sns, shortAddress, cachedTryToResolveAddress]);

  return {
    tryToResolveAddress,
    addressOrName,
    isChecking,
  };
};

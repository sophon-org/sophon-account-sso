'use server';

import {
  AuthService,
  type ChainId,
  isOsChainId,
} from '@sophon-labs/account-core';
import type { Address } from 'viem';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { hyperindexService } from './hyperindex.service';

export const getsSmartAccounts = async (ownerAddress: Address) => {
  const chainId = SOPHON_VIEM_CHAIN.id as ChainId;
  return await AuthService.getSmartAccount(chainId, ownerAddress);
};

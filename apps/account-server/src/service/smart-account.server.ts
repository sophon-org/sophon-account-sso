'use server';

import type { Address } from 'viem';
import { hyperindexService } from './hyperindex.service';

export const getsSmartAccounts = async (ownerAddress: Address) => {
  return hyperindexService.getOwnedSmartAccounts(ownerAddress);
};

import type { Address } from 'viem';
import { hyperindexService } from './hyperindex.service';

export const getsSmartAccounts = async (ownerAddress: Address) => {
  return hyperindexService.getOwnedSmartAccounts(ownerAddress);
};

export const deployAccount = async (ownerAddress: Address) => {
  const response = await fetch(`/api/account/${ownerAddress.toLowerCase()}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to deploy account');
  }

  return response.json() as Promise<{ accounts: Address[] }>;
};

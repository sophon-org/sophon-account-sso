import type { Address } from 'viem';

export const getsSmartAccounts = async (ownerAddress: Address) => {
  const response = await fetch(`/api/account/${ownerAddress.toLowerCase()}`);

  if (!response.ok) {
    throw new Error('Failed to get smart accounts');
  }

  return response.json() as Promise<{ accounts: Address[] }>;
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

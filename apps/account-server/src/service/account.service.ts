import type { Address } from 'viem';

export const deployAccount = async (ownerAddress: Address) => {
  const response = await fetch(`/api/account/${ownerAddress.toLowerCase()}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to deploy account');
  }

  return (await response.json()) as Promise<{ accounts: Address[] }>;
};

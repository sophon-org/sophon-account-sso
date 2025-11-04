import { AvailableCDNURL, type ChainId } from '@sophon-labs/account-core';

export interface PartnerConfigSchema {
  name: string;
  domains: string[];
}

export const fetchPartnerConfig = async (
  chainId: ChainId,
  partnerId: string,
) => {
  try {
    const response = await fetch(
      `${AvailableCDNURL[chainId]}/partners/sdk/${partnerId}.json`,
    );
    return response.json() as Promise<PartnerConfigSchema>;
  } catch (error) {
    console.error('Error fetching partner config', error);
    return null;
  }
};

export const isValidPartner = async (chainId: ChainId, partnerId: string) => {
  const config = await fetchPartnerConfig(chainId, partnerId);
  return config !== null;
};

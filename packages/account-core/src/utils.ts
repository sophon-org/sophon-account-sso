import { AvailableCDNURL, type ChainId } from './constants';

/**
 * Check if a partnerId is valid
 *
 * @param chainId - The chainId to use
 * @param partnerId - The partner id to check
 * @returns True if the partner is valid, false otherwise
 */
export const isValidPartner = async (chainId: ChainId, partnerId: string) => {
  if (!partnerId) {
    return false;
  }

  const baseDns = AvailableCDNURL[chainId];

  try {
    const url = `${baseDns}/partners/sdk/${partnerId}.json`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error('Error fetching partner', error);
    return false;
  }
};

/**
 * Check if the code is running on the server
 *
 * @returns True if the code is running on the server, false otherwise
 */
export const isSSR = () => {
  return typeof window === 'undefined';
};

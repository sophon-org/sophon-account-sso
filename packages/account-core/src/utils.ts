import { AvailableCDNURL, type SophonNetworkType } from './constants';

/**
 * Check if a partnerId is valid
 *
 * @param network - The network to use
 * @param partnerId - The partner id to check
 * @returns True if the partner is valid, false otherwise
 */
export const isValidPartner = async (
  network: SophonNetworkType,
  partnerId: string,
) => {
  if (!partnerId) {
    return false;
  }

  const baseDns = AvailableCDNURL[network];

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

import type { SophonNetworkType } from '@sophon-labs/account-core';

/**
 * Account API URLs for the different networks.
 */
export const AccountServerAPI: Record<SophonNetworkType, string> = {
  /** Mainnet should be used for production and with your own partnerId */
  mainnet: 'https://api.my.sophon.xyz',

  /** Testnet should be used for development and you can user a development shared partnerIdß */
  testnet: 'https://api.my.staging.sophon.xyz',
};

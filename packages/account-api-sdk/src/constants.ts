import type { SophonNetworkType } from '@sophon-labs/account-core';

export const AccountServerAPI: Record<SophonNetworkType, string> = {
  mainnet: 'https://api.my.sophon.xyz',
  testnet: 'https://api.my.staging.sophon.xyz',
};

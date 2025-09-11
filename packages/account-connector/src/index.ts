import type { SophonNetworkType } from '@sophon-labs/account-core';
import type { Communicator } from 'zksync-sso/communicator';
import { zksyncSsoConnector } from 'zksync-sso/connector';
import { createDelegateProvider as createProxyProvider } from './delegate-provider';
import { paramsBuilder } from './params';

export interface SophonConnectorOptions {
  session?: unknown;
  paymaster?: `0x${string}`;
  communicator?: Communicator;
  authServerUrl: string;
}

/**
 * Create a Sophon Account connector for wagmi
 *
 * @param partnerId - the partner id
 * @param network - the network, 'mainnet' or 'testnet'
 * @param options - the options, see {@link SophonConnectorOptions}
 * @returns the connector function
 */
export const createSophonConnector = (
  partnerId: string,
  network: SophonNetworkType = 'testnet',
  options?: SophonConnectorOptions,
) => {
  if (!partnerId) {
    throw new Error('partnerId is required');
  }
  const params = paramsBuilder(partnerId, network, options);

  const connector = zksyncSsoConnector({
    ...params,
    provider: createSophonProvider(partnerId, network, options),
  });

  return connector;
};

/**
 * Create a Sophon Account provider for viem
 *
 * @param partnerId - the partner id
 * @param network - the network, 'mainnet' or 'testnet'
 * @param options - the options, see {@link SophonConnectorOptions}
 * @returns the provider object
 */
export const createSophonProvider = (
  partnerId: string,
  network: SophonNetworkType,
  options?: SophonConnectorOptions,
) => {
  if (!partnerId) {
    throw new Error('partnerId is required');
  }

  const params = paramsBuilder(partnerId, network, options);
  return createProxyProvider(network, params);
};

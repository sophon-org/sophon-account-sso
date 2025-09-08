import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { type Communicator, PopupCommunicator } from 'zksync-sso/communicator';
import { zksyncSsoConnector } from 'zksync-sso/connector';
import { createDelegateProvider as createProxyProvider } from './provider';

interface SophonSsoConnectorOptions {
  session?: unknown;
  paymaster?: `0x${string}`;
  communicator?: Communicator;
  authServerUrl: string;
}

export const sophonSsoConnector = (
  partnerId: string,
  network: SophonNetworkType = 'testnet',
  options?: SophonSsoConnectorOptions,
) => {
  if (!partnerId) {
    throw new Error('partnerId is required');
  }
  const authServerUrl = options?.authServerUrl ?? AccountServerURL[network];
  const finalAuthServerUrl = partnerId
    ? `${authServerUrl}/${partnerId}`
    : authServerUrl;

  const params = {
    authServerUrl: finalAuthServerUrl,
    metadata: {
      name: network === 'mainnet' ? 'Sophon Account' : 'Sophon Account Test',
      icon: '/sophon-icon.png',
    },
    connectorMetadata: {
      id:
        network === 'mainnet'
          ? 'xyz.sophon.account'
          : 'xyz.sophon.staging.account',
      name: network === 'mainnet' ? 'Sophon Account' : 'Sophon Account Test',
      icon: 'https://sophon.xyz/favicon.ico',
      type: 'zksync-sso',
    },
    communicator:
      options?.communicator ||
      new PopupCommunicator(finalAuthServerUrl, {
        width: 360,
        height: 800,
        calculatePosition(width, height) {
          return {
            left: window.screenX + (window.outerWidth - width) / 2,
            top: window.screenY + (window.outerHeight - height) / 2,
          };
        },
      }),
  };

  const connector = zksyncSsoConnector({
    ...params,
    provider: createProxyProvider(network, params),
  });

  return connector;
};

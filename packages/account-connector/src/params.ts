import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { PopupCommunicator } from 'zksync-sso/communicator';
import type { SophonConnectorOptions } from '.';

export const paramsBuilder = (
  partnerId: string,
  network: SophonNetworkType = 'testnet',
  options?: SophonConnectorOptions,
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

  return params;
};

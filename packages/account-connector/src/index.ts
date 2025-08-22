import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { type Communicator, PopupCommunicator } from 'zksync-sso/communicator';
import { zksyncSsoConnector } from 'zksync-sso/connector';

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

  const connector = zksyncSsoConnector({
    authServerUrl: finalAuthServerUrl,
    metadata: {
      name: network === 'mainnet' ? 'Sophon Account' : 'Sophon Account Test',
      icon: '/sophon-icon.png',
    },
    // paymasterHandler: async () => ({
    //   paymaster:
    //     options?.paymaster || '0x98546B226dbbA8230cf620635a1e4ab01F6A99B2',
    //   paymasterInput: '0x',
    // }),
    // Remove session config to test auth-server mode
    // session: options?.session || {
    //   expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24), // 24 hours
    //   feeLimit: {
    //     limitType: "Lifetime" as const, // Need to check proper enum value
    //     limit: parseEther("0.01"), // 0.01 ETH for gas fees
    //   },
    //   callPolicies: [], // Contract calls allowed
    //   transferPolicies: [], // Token transfers allowed
    //   // Message signing is implicitly allowed in sessions
    // },
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
  });

  return connector;
};

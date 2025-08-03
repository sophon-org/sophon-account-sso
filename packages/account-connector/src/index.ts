import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { type Communicator, PopupCommunicator } from 'zksync-sso/communicator';
import { zksyncSsoConnector } from 'zksync-sso/connector';

interface SophonSsoConnectorOptions {
  // biome-ignore lint/suspicious/noExplicitAny: TODO: review this
  session?: any;
  paymaster?: `0x${string}`;
  communicator?: Communicator;
  authServerUrl: string;
}

// biome-ignore lint/suspicious/noExplicitAny: TODO remove later
export const sophonSsoConnector: any = (
  network: SophonNetworkType = 'testnet',
  options?: SophonSsoConnectorOptions,
) => {
  console.log(
    'creating',
    network,
    AccountServerURL,
    options?.authServerUrl,
    AccountServerURL[network],
  );
  const connector = zksyncSsoConnector({
    authServerUrl: options?.authServerUrl ?? AccountServerURL[network],
    metadata: {
      name: network === 'mainnet' ? 'Sophon Wallet' : 'Sophon Testnet Wallet',
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
      new PopupCommunicator(
        options?.authServerUrl ?? AccountServerURL[network],
        {
          width: 360,
          height: 800,
          calculatePosition(width, height) {
            return {
              left: window.screenX + (window.outerWidth - width) / 2,
              top: window.screenY + (window.outerHeight - height) / 2,
            };
          },
        },
      ),
  });

  return connector;
};

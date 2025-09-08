import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { EventEmitter } from 'eventemitter3';
import { type Communicator, PopupCommunicator } from 'zksync-sso/communicator';
import { handleAccounts } from './handlers/handleAccounts';
import { handleChainId } from './handlers/handleChainId';
import { handlePersonalSign } from './handlers/handlePersonalSign';
import { handleRequestAccounts } from './handlers/handleRequestAccounts';
import { handleRevokePermissions } from './handlers/handleRevokePermissions';
import { handleSendTransaction } from './handlers/handleSendTransaction';
import { handleSignTypedDataV4 } from './handlers/handleSignTypedDataV4';
import { handleSwitchEthereumChain } from './handlers/handleSwitchEthereumChain';
import { genericRPCHandler } from './lib/genericRPC';
import { awaitForPopupUnload } from './lib/popup';
import type { EIP1193Provider, RPCResponse } from './types';

// The main provider function
export function createSophonEIP1193Provider(
  network: SophonNetworkType = 'testnet',
  authServerUrl: string = AccountServerURL[network],
  customCommunicator?: Communicator,
): EIP1193Provider {
  const eventEmitter = new EventEmitter();

  const communicator =
    customCommunicator ??
    new PopupCommunicator(authServerUrl, {
      width: 400,
      height: 800,
      calculatePosition(width, height) {
        return {
          left: window.screenX + (window.outerWidth - width) / 2,
          top: window.screenY + (window.outerHeight - height) / 2,
        };
      },
    });

  // Helper to make requests through the existing communicator, and coordinating the popup management
  async function executeRequest<T>(
    method: string,
    params?: unknown[],
  ): Promise<RPCResponse<T>> {
    const request = {
      id: crypto.randomUUID(),
      content: {
        action: { method, params: params || [] },
      },
    };

    const response = await communicator.postRequestAndWaitForResponse(request);
    await awaitForPopupUnload(authServerUrl);
    return response as RPCResponse<T>;
  }

  return {
    on: eventEmitter.on.bind(eventEmitter),
    removeListener: eventEmitter.removeListener.bind(eventEmitter),

    async request({ method, params }) {
      switch (method) {
        case 'eth_requestAccounts': {
          console.log('EIP-1193 eth_requestAccounts:', method, params);
          return handleRequestAccounts(network, executeRequest, eventEmitter);
        }

        case 'eth_accounts': {
          console.log('EIP-1193 eth_accounts:', method, params);
          return handleAccounts(network);
        }

        case 'eth_chainId': {
          console.log('EIP-1193 eth_chainId:', method, params);
          return handleChainId(network);
        }

        case 'wallet_switchEthereumChain': {
          console.log('EIP-1193 wallet_switchEthereumChain:', method, params);
          return handleSwitchEthereumChain(network, params as unknown[]);
        }

        case 'personal_sign': {
          console.log('EIP-1193 personal_sign:', method, params);
          return handlePersonalSign(executeRequest, params as unknown[]);
        }

        case 'eth_signTypedData_v4': {
          console.log('EIP-1193 eth_signTypedData_v4:', method, params);
          return handleSignTypedDataV4(executeRequest, params as unknown[]);
        }

        case 'eth_sendTransaction': {
          console.log('EIP-1193 eth_sendTransaction:', method, params);
          return handleSendTransaction(executeRequest, params as unknown[]);
        }

        case 'wallet_revokePermissions': {
          console.log('EIP-1193 wallet_revokePermissions:', method, params);
          return handleRevokePermissions(network, executeRequest, eventEmitter);
        }

        case 'wallet_requestPermissions': {
          console.log('EIP-1193 wallet_requestPermissions:', method, params);
          return handleRequestAccounts(network, executeRequest, eventEmitter);
        }

        default: {
          // passthrough methods to the RPC client, no need for sending them to the account server
          // we can do common RPC call here
          console.log('EIP-1193 passthrough method:', method, params);
          return await genericRPCHandler(network).request(method, params);
        }
      }
    },
  };
}

import {
  AccountServerURL,
  type SophonNetworkType,
} from '@sophon-labs/account-core';
import { PopupCommunicator } from 'zksync-sso/communicator';
import type { EIP1193Provider } from './types';

// Simple state management
let currentAccounts: string[] = [];
// biome-ignore lint/suspicious/noExplicitAny: TODO: review this
const eventListeners = new Map<string, ((...args: any[]) => void)[]>();

// The main provider function
export function createSophonEIP1193Provider(
  network: SophonNetworkType = 'testnet',
): EIP1193Provider {
  const communicator = new PopupCommunicator(AccountServerURL[network], {
    width: 360,
    height: 800,
    calculatePosition(width, height) {
      return {
        left: window.screenX + (window.outerWidth - width) / 2,
        top: window.screenY + (window.outerHeight - height) / 2,
      };
    },
  });

  // Hydrate from storage (silent) so eth_accounts can return without UI.
  const storageKey = `sophon.accounts.${network}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) currentAccounts = JSON.parse(saved);
  } catch {}

  // Helper to make requests through the existing communicator
  // biome-ignore lint/suspicious/noExplicitAny: TODO: review this
  async function makeAuthRequest(method: string, params?: any): Promise<any> {
    const request = {
      id: crypto.randomUUID(),
      content: {
        action: { method, params: params || [] },
      },
    };

    const response = await communicator.postRequestAndWaitForResponse(request);
    return response;
  }

  return {
    async request({ method, params }) {
      console.log('EIP-1193 request:', method, params);

      switch (method) {
        case 'eth_requestAccounts':
          try {
            const result = await makeAuthRequest('eth_requestAccounts');
            console.log('EIP-1193 request result:', result);
            const address = result?.content?.result?.account?.address;
            currentAccounts = address ? [address] : [];

            const listeners = eventListeners.get('accountsChanged') || [];
            listeners.forEach((listener) => listener(currentAccounts));

            // Persist for silent restore on refresh
            try {
              localStorage.setItem(storageKey, JSON.stringify(currentAccounts));
            } catch {}

            return currentAccounts;
          } catch (error) {
            console.error('Failed to connect:', error);
            throw error;
          }

        case 'eth_accounts': {
          console.log('EIP-1193 eth_accounts:', method, params);
          return currentAccounts;
        }

        case 'eth_chainId': {
          console.log('EIP-1193 eth_chainId:', method, params);
          return '0x1fa72e78';
        }

        case 'wallet_switchEthereumChain': {
          console.log('EIP-1193 wallet_switchEthereumChain:', method, params);
          // Handle chain switching requests - for now just return success
          // since we only support Sophon testnet
          // biome-ignore lint/suspicious/noExplicitAny: TODO: Review this
          const targetChainId = (params as any)?.[0]?.chainId;
          if (targetChainId === '0x1fa72e78') {
            return null; // Success
          } else {
            throw new Error(`Unsupported chain: ${targetChainId}`);
          }
        }

        case 'personal_sign': {
          console.log('EIP-1193 personal_sign:', method, params);
          const result = await makeAuthRequest('personal_sign', params);
          return result?.content?.result;
        }

        case 'eth_signTypedData_v4': {
          console.log('EIP-1193 eth_signTypedData_v4:', method, params);
          const result = await makeAuthRequest('eth_signTypedData_v4', params);
          return result?.content?.result;
        }

        case 'eth_sendTransaction': {
          console.log('EIP-1193 eth_sendTransaction:', method, params);
          return await makeAuthRequest('eth_sendTransaction', params);
        }

        case 'wallet_revokePermissions': {
          console.log('EIP-1193 wallet_revokePermissions:', method, params);

          try {
            // Clear local provider state
            localStorage.removeItem(`sophon.accounts.${network}`);
            currentAccounts = [];

            // Send logout request to the account server popup
            await makeAuthRequest('wallet_revokePermissions');
          } catch (error) {
            console.warn(
              'Failed to send logout request to account server:',
              error,
            );
          }

          // Notify listeners about the account change
          const listeners = eventListeners.get('accountsChanged') || [];
          listeners.forEach((listener) => listener(currentAccounts));

          return currentAccounts;
        }

        default:
          throw new Error(`Method ${method} not supported`);
      }
    },

    // biome-ignore lint/suspicious/noExplicitAny: TODO: Review this
    on(eventName: string, callback: (...args: any[]) => void) {
      if (!eventListeners.has(eventName)) {
        eventListeners.set(eventName, []);
      }
      eventListeners.get(eventName)!.push(callback);
    },
  };
}

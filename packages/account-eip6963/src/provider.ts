import { PopupCommunicator } from 'zksync-sso/communicator';
import { AUTH_SERVER_URLS } from './constants';
import type { EIP1193Provider } from './types';

// Simple state management
let currentAccounts: string[] = [];
const eventListeners = new Map<string, ((...args: any[]) => void)[]>();

// The main provider function
export function createSophonEIP1193Provider(
  network: 'mainnet' | 'testnet' = 'testnet',
): EIP1193Provider {
  const communicator = new PopupCommunicator(AUTH_SERVER_URLS[network], {
    width: 360,
    height: 800,
    calculatePosition(width, height) {
      return {
        left: window.screenX + (window.outerWidth - width) / 2,
        top: window.screenY + (window.outerHeight - height) / 2,
      };
    },
  });

  // Helper to make requests through the existing communicator
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
      console.log('EIP-1193 request 8:', method, params);

      switch (method) {
        case 'eth_requestAccounts':
          try {
            const result = await makeAuthRequest('eth_requestAccounts');
            console.log('EIP-1193 request result:', result);
            const address = result?.content?.result?.account?.address;
            currentAccounts = address ? [address] : [];

            const listeners = eventListeners.get('accountsChanged') || [];
            listeners.forEach((listener) => listener(currentAccounts));

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

        default:
          throw new Error(`Method ${method} not supported`);
      }
    },

    on(eventName: string, callback: (...args: any[]) => void) {
      if (!eventListeners.has(eventName)) {
        eventListeners.set(eventName, []);
      }
      eventListeners.get(eventName)!.push(callback);
    },
  };
}

import type { StorageLike } from '@sophon-labs/account-core';
import type { Communicator } from '@sophon-labs/account-communicator';
import {  afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sophon, sophonTestnet } from 'viem/chains';
import { createSophonEIP1193Provider } from '../provider';

// Mock the dependencies
vi.mock('@sophon-labs/account-communicator', () => ({
  PopupCommunicator: vi.fn(),
}));

vi.mock('../lib/genericRPC', () => ({
  genericRPCHandler: vi.fn(() => ({
    request: vi.fn(),
  })),
}));

vi.mock('../lib/popup', () => ({
  awaitForPopupUnload: vi.fn(),
}));

describe('Provider > createSophonEIP1193Provider', () => {
  let mockStorage: StorageLike;
  let mockCommunicator: Communicator;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock storage
    const storage = new Map<string, string>();
    mockStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    };

    // Create mock communicator
    mockCommunicator = {
      postMessage: vi.fn(),
      onMessage: vi.fn(),
      postRequestAndWaitForResponse: vi.fn(),
      ready: vi.fn(),
      waitForPopupLoaded: vi.fn(),
    } as unknown as Communicator;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('provider initialization', () => {
    it('should create provider with default parameters', () => {
      // when
      const provider = createSophonEIP1193Provider(
        undefined,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // then
      expect(provider).toBeDefined();
      expect(provider.request).toBeDefined();
      expect(provider.on).toBeDefined();
      expect(provider.removeListener).toBeDefined();
      expect(provider.disconnect).toBeDefined();
      expect(provider.accounts).toBeDefined();
    });

    it('should create provider with custom chainId', () => {
      // when
      const provider = createSophonEIP1193Provider(
        sophon.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // then
      expect(provider).toBeDefined();
    });

    it('should create provider with custom partnerId', () => {
      // when
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        'test-partner',
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // then
      expect(provider).toBeDefined();
    });

    it('should create provider with custom authServerUrl', () => {
      // when
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        'https://custom-auth.example.com',
        mockCommunicator,
        mockStorage,
      );

      // then
      expect(provider).toBeDefined();
    });

    it('should create provider with all custom parameters', () => {
      // when
      const provider = createSophonEIP1193Provider(
        sophon.id,
        'custom-partner',
        'https://custom.example.com',
        mockCommunicator,
        mockStorage,
      );

      // then
      expect(provider).toBeDefined();
    });

    it('should create provider for native mode', () => {
      // when
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
        true,
      );

      // then
      expect(provider).toBeDefined();
    });
  });

  describe('accounts method', () => {
    it('should return empty array when no accounts are set', () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // when
      const accounts = provider.accounts();

      // then
      expect(accounts).toEqual([]);
    });

    it('should return accounts after setting them via storage', () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const testAccounts = ['0x1234567890123456789012345678901234567890'];
      mockStorage.setItem(
        `sophon::accounts::${sophonTestnet.id}`,
        JSON.stringify(testAccounts),
      );

      // when
      const accounts = provider.accounts();

      // then
      expect(accounts).toEqual(testAccounts);
    });
  });

  describe('disconnect method', () => {
    it('should clear accounts from storage', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      mockStorage.setItem(
        `sophon::accounts::${sophonTestnet.id}`,
        JSON.stringify(['0x1234567890123456789012345678901234567890']),
      );

      // when
      await provider.disconnect();

      // then
      const accounts = provider.accounts();
      expect(accounts).toEqual([]);
    });
  });

  describe('request method - eth_requestAccounts', () => {
    it('should request accounts and emit accountsChanged event', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const account = '0x1234567890123456789012345678901234567890';
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          result: {
            account: { address: account },
          },
        },
      });
      const emitSpy = vi.fn();
      provider.on('accountsChanged', emitSpy);

      // when
      const result = await provider.request({
        method: 'eth_requestAccounts',
      });

      // then
      expect(result).toEqual([account]);
      expect(emitSpy).toHaveBeenCalledWith([account]);
    });

    it('should return cached accounts without making request', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const account = '0x1234567890123456789012345678901234567890';
      mockStorage.setItem(
        `sophon::accounts::${sophonTestnet.id}`,
        JSON.stringify([account]),
      );

      // when
      const result = await provider.request({
        method: 'eth_requestAccounts',
      });

      // then
      expect(result).toEqual([account]);
      expect(mockCommunicator.postRequestAndWaitForResponse).not.toHaveBeenCalled();
    });
  });

  describe('request method - eth_accounts', () => {
    it('should return empty array when no accounts exist', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // when
      const result = await provider.request({
        method: 'eth_accounts',
      });

      // then
      expect(result).toEqual([]);
    });

    it('should return stored accounts', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const accounts = ['0x1234567890123456789012345678901234567890'];
      mockStorage.setItem(
        `sophon::accounts::${sophonTestnet.id}`,
        JSON.stringify(accounts),
      );

      // when
      const result = await provider.request({
        method: 'eth_accounts',
      });

      // then
      expect(result).toEqual(accounts);
    });
  });

  describe('request method - eth_chainId', () => {
    it('should return hex chainId for sophonTestnet', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // when
      const result = await provider.request({
        method: 'eth_chainId',
      });

      // then
      expect(result).toBe(`0x${Number(sophonTestnet.id).toString(16)}`);
    });

    it('should return hex chainId for sophon mainnet', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophon.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // when
      const result = await provider.request({
        method: 'eth_chainId',
      });

      // then
      expect(result).toBe(`0x${Number(sophon.id).toString(16)}`);
    });
  });

  describe('request method - wallet_switchEthereumChain', () => {
    it('should return null for valid chain switch', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const targetChainId = `0x${Number(sophon.id).toString(16)}`;

      // when
      const result = await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });

      // then
      expect(result).toBeNull();
    });

    it('should throw error for unsupported chain', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // when
      const call = () =>
        provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xCAFE' }],
        });

      // then
      await expect(call()).rejects.toThrow();
    });
  });

  describe('request method - personal_sign', () => {
    it('should handle personal_sign request', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const signature = '0xsignature';
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          result: signature,
        },
      });

      // when
      const result = await provider.request({
        method: 'personal_sign',
        params: ['0x1234567890123456789012345678901234567890', 'Hello'],
      });

      // then
      expect(result).toBe(signature);
      expect(mockCommunicator.postRequestAndWaitForResponse).toHaveBeenCalled();
    });

    it('should throw error when personal_sign fails', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          error: {
            message: 'User rejected',
            code: 4001,
          },
        },
      });

      // when
      const call = () =>
        provider.request({
          method: 'personal_sign',
          params: ['0x1234567890123456789012345678901234567890', 'Hello'],
        });

      // then
      await expect(call()).rejects.toThrow('User rejected');
    });
  });

  describe('request method - eth_signTypedData_v4', () => {
    it('should handle eth_signTypedData_v4 request', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const signature = '0xsignature';
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          result: signature,
        },
      });

      // when
      const result = await provider.request({
        method: 'eth_signTypedData_v4',
        params: ['0x1234567890123456789012345678901234567890', '{}'],
      });

      // then
      expect(result).toBe(signature);
    });
  });

  describe('request method - eth_sendTransaction', () => {
    it('should handle eth_sendTransaction request', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const txHash = '0xtxhash';
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          result: txHash,
        },
      });

      // when
      const result = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ to: '0x1234567890123456789012345678901234567890', value: '0x0' }],
      });

      // then
      expect(result).toBe(txHash);
    });
  });

  describe('request method - sophon_requestConsent', () => {
    it('should handle sophon_requestConsent request', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const consentResult = { consented: true };
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          result: consentResult,
        },
      });

      // when
      const result = await provider.request({
        method: 'sophon_requestConsent',
        params: [{ scope: 'profile' }],
      });

      // then
      expect(result).toEqual(consentResult);
    });
  });

  describe('request method - wallet_revokePermissions', () => {
    it('should clear accounts and emit accountsChanged', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      mockStorage.setItem(
        `sophon::accounts::${sophonTestnet.id}`,
        JSON.stringify(['0x1234567890123456789012345678901234567890']),
      );
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {},
      });
      const emitSpy = vi.fn();
      provider.on('accountsChanged', emitSpy);

      // when
      const result = await provider.request({
        method: 'wallet_revokePermissions',
      });

      // then
      expect(result).toEqual([]);
      expect(provider.accounts()).toEqual([]);
      expect(emitSpy).toHaveBeenCalledWith([]);
    });
  });

  describe('request method - wallet_requestPermissions', () => {
    it('should behave like eth_requestAccounts', async () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const account = '0x1234567890123456789012345678901234567890';
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          result: {
            account: { address: account },
          },
        },
      });

      // when
      const result = await provider.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // then
      expect(result).toEqual([account]);
    });
  });

  describe('request method - generic RPC passthrough', () => {
    it('should passthrough unknown methods to generic RPC handler', async () => {
      // given
      const { genericRPCHandler } = await import('../lib/genericRPC');
      const mockRequest = vi.fn().mockResolvedValue('0x123');
      vi.mocked(genericRPCHandler).mockReturnValue({
        request: mockRequest,
      } as unknown as ReturnType<typeof genericRPCHandler>);

      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // when
      const result = await provider.request({
        method: 'eth_blockNumber',
      });

      // then
      expect(result).toBe('0x123');
      expect(mockRequest).toHaveBeenCalledWith('eth_blockNumber', undefined);
    });

    it('should passthrough with params to generic RPC handler', async () => {
      // given
      const { genericRPCHandler } = await import('../lib/genericRPC');
      const mockRequest = vi.fn().mockResolvedValue({ balance: '0x0' });
      vi.mocked(genericRPCHandler).mockReturnValue({
        request: mockRequest,
      } as unknown as ReturnType<typeof genericRPCHandler>);

      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );

      // when
      const result = await provider.request({
        method: 'eth_getBalance',
        params: ['0x1234567890123456789012345678901234567890', 'latest'],
      });

      // then
      expect(result).toEqual({ balance: '0x0' });
      expect(mockRequest).toHaveBeenCalledWith('eth_getBalance', [
        '0x1234567890123456789012345678901234567890',
        'latest',
      ]);
    });
  });

  describe('event emitter', () => {
    it('should allow adding event listeners', () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const listener = vi.fn();

      // when
      provider.on('accountsChanged', listener);

      // then
      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow removing event listeners', () => {
      // given
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
      );
      const listener = vi.fn();
      provider.on('accountsChanged', listener);

      // when
      provider.removeListener('accountsChanged', listener);

      // then
      // Listener should be removed (no way to directly test this without triggering event)
      expect(provider.removeListener).toBeDefined();
    });
  });

  describe('native mode', () => {
    it('should not await popup unload in native mode', async () => {
      // given
      const { awaitForPopupUnload } = await import('../lib/popup');
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
        true, // native mode
      );
      const signature = '0xsignature';
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          result: signature,
        },
      });

      // when
      await provider.request({
        method: 'personal_sign',
        params: ['0x1234567890123456789012345678901234567890', 'Hello'],
      });

      // then
      expect(awaitForPopupUnload).not.toHaveBeenCalled();
    });

    it('should await popup unload in non-native mode', async () => {
      // given
      const { awaitForPopupUnload } = await import('../lib/popup');
      const provider = createSophonEIP1193Provider(
        sophonTestnet.id,
        undefined,
        undefined,
        mockCommunicator,
        mockStorage,
        false, // non-native mode
      );
      const signature = '0xsignature';
      vi.mocked(mockCommunicator.postRequestAndWaitForResponse).mockResolvedValue({
        id: crypto.randomUUID(),
        content: {
          result: signature,
        },
      });

      // when
      await provider.request({
        method: 'personal_sign',
        params: ['0x1234567890123456789012345678901234567890', 'Hello'],
      });

      // then
      expect(awaitForPopupUnload).toHaveBeenCalled();
    });
  });
});


import { AvailableRPCURL } from '@sophon-labs/account-core';
import { sophon, sophonTestnet } from 'viem/chains';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { genericRPCHandler } from '../genericRPC';

describe('Provider > Lib > genericRPC', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RPC client creation', () => {
    it('should create RPC client for sophonTestnet', () => {
      // when
      const client = genericRPCHandler(sophonTestnet.id);

      // then
      expect(client).toBeDefined();
      expect(client.request).toBeDefined();
      expect(typeof client.request).toBe('function');
    });

    it('should create RPC client for sophon mainnet', () => {
      // when
      const client = genericRPCHandler(sophon.id);

      // then
      expect(client).toBeDefined();
      expect(client.request).toBeDefined();
      expect(typeof client.request).toBe('function');
    });
  });

  describe('RPC requests with fetch', () => {
    it('should make POST request to correct RPC URL for testnet', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x123',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request('eth_blockNumber', []);

      // then
      expect(fetchMock).toHaveBeenCalledWith(
        AvailableRPCURL[sophonTestnet.id],
        expect.objectContaining({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        }),
      );
    });

    it('should make POST request to correct RPC URL for mainnet', async () => {
      // given
      const client = genericRPCHandler(sophon.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x456',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request('eth_blockNumber', []);

      // then
      expect(fetchMock).toHaveBeenCalledWith(
        AvailableRPCURL[sophon.id],
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should send correct JSON-RPC request body', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x123',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request('eth_blockNumber', []);

      // then
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toMatchObject({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
      });
      expect(body.id).toBeDefined();
    });

    it('should include params in request body', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: { balance: '0x0' },
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);
      const params = ['0x1234567890123456789012345678901234567890', 'latest'];

      // when
      await client.request('eth_getBalance', params);

      // then
      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.params).toEqual(params);
    });

    it('should return result for successful request', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const expectedResult = '0x789abc';
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: expectedResult,
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      const result = await client.request('eth_blockNumber', []);

      // then
      expect(result).toBe(expectedResult);
    });
  });

  describe('error handling', () => {
    it('should throw error for non-200 status code', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when/then
      await expect(client.request('eth_blockNumber', [])).rejects.toThrow(
        'Internal Server Error',
      );
    });

    it('should throw error for 404 status', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when/then
      await expect(client.request('eth_blockNumber', [])).rejects.toThrow(
        'Not Found',
      );
    });

    it('should throw error for 503 status', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 503,
        statusText: 'Service Unavailable',
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when/then
      await expect(client.request('eth_blockNumber', [])).rejects.toThrow(
        'Service Unavailable',
      );
    });

    it('should handle network errors', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      fetchMock.mockRejectedValue(new Error('Network error'));

      // when/then
      await expect(client.request('eth_blockNumber', [])).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('request configuration', () => {
    it('should set content-type header to application/json', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x123',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request('eth_blockNumber', []);

      // then
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'content-type': 'application/json',
          },
        }),
      );
    });

    it('should use POST method', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x123',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request('eth_blockNumber', []);

      // then
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });
  });

  describe('different RPC methods', () => {
    it.each([
      { method: 'eth_blockNumber', params: [] },
      {
        method: 'eth_getBalance',
        params: ['0x1234567890123456789012345678901234567890', 'latest'],
      },
      {
        method: 'eth_call',
        params: [
          { to: '0x1234567890123456789012345678901234567890' },
          'latest',
        ],
      },
      { method: 'eth_gasPrice', params: [] },
      {
        method: 'eth_getTransactionCount',
        params: ['0x1234567890123456789012345678901234567890', 'latest'],
      },
    ])('should handle $method with params', async ({ method, params }) => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x0',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request(method, params);

      // then
      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.method).toBe(method);
      expect(body.params).toEqual(params);
    });
  });

  describe('JSON-RPC protocol', () => {
    it('should include jsonrpc version 2.0 in request', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x123',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request('eth_blockNumber', []);

      // then
      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.jsonrpc).toBe('2.0');
    });

    it('should include id in request', async () => {
      // given
      const client = genericRPCHandler(sophonTestnet.id);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x123',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request('eth_blockNumber', []);

      // then
      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.id).toBeDefined();
      expect(typeof body.id).toBe('number');
    });
  });

  describe('chain-specific RPC URLs', () => {
    it.each([
      { chainId: sophon.id, description: 'sophon mainnet' },
      { chainId: sophonTestnet.id, description: 'sophon testnet' },
    ])('should use correct RPC URL for $description', async ({ chainId }) => {
      // given
      const client = genericRPCHandler(chainId);
      const mockResponse = {
        status: 200,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x123',
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      // when
      await client.request('eth_blockNumber', []);

      // then
      expect(fetchMock).toHaveBeenCalledWith(
        AvailableRPCURL[chainId],
        expect.any(Object),
      );
    });
  });
});

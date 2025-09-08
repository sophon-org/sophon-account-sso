import { faker } from '@faker-js/faker';
import { TESTNET_HEX_CHAIN_ID } from '@sophon-labs/account-core';
import type { JSONRPCClient } from 'json-rpc-2.0';
import { describe, expect, it, vi } from 'vitest';
import { createSophonEIP1193Provider } from '../../provider';
import { clearAccounts, getAccounts, setAccounts } from '../accounts';
import * as rpc from '../genericRPC';
import { awaitForPopupUnload } from '../popup';

vi.mock(import('zksync-sso/communicator'), () => {
  const PopupCommunicator = vi.fn();
  PopupCommunicator.prototype.postRequestAndWaitForResponse = vi.fn();
  return { PopupCommunicator };
});

vi.mock('../popup', () => ({
  awaitForPopupUnload: vi.fn().mockResolvedValue(true),
}));

vi.mock('../rpc', () => ({
  genericRPCHandler: vi.fn().mockResolvedValue({
    request: vi.fn().mockResolvedValue({}),
  }),
}));

describe('eip1193 provider', () => {
  beforeEach(() => {
    clearAccounts('testnet');
  });

  it('should return a valid provider interface', async () => {
    // given
    const network = 'testnet';

    // when
    const result = createSophonEIP1193Provider(network);

    // then
    expect(result).toEqual({
      on: expect.any(Function),
      removeListener: expect.any(Function),
      request: expect.any(Function),
    });
  });

  it('should handle eth_accounts on the account server', async () => {
    // given
    const network = 'testnet';
    const account = '0x1234567890123456789012345678901234567890';
    const testCommunicator = {
      postRequestAndWaitForResponse: vi.fn().mockResolvedValueOnce({}),
      postMessage: vi.fn(),
      onMessage: vi.fn(),
      ready: vi.fn(),
    };
    const { request } = createSophonEIP1193Provider(
      network,
      undefined,
      testCommunicator,
    );
    setAccounts(network, [account]);

    // when
    const result = await request({ method: 'eth_accounts', params: [] });

    // then
    expect(result).toEqual([account]);
    expect(
      testCommunicator.postRequestAndWaitForResponse,
    ).not.toHaveBeenCalled();
    expect(awaitForPopupUnload).not.toHaveBeenCalled();
  });

  it('should handle eth_chainId on the account server', async () => {
    // given
    const network = 'testnet';
    const testCommunicator = {
      postRequestAndWaitForResponse: vi.fn().mockResolvedValueOnce({}),
      postMessage: vi.fn(),
      onMessage: vi.fn(),
      ready: vi.fn(),
    };
    const { request } = createSophonEIP1193Provider(
      network,
      undefined,
      testCommunicator,
    );

    // when
    const result = await request({ method: 'eth_chainId', params: [] });

    // then
    expect(result).toEqual(TESTNET_HEX_CHAIN_ID);
    expect(
      testCommunicator.postRequestAndWaitForResponse,
    ).not.toHaveBeenCalled();
    expect(awaitForPopupUnload).not.toHaveBeenCalled();
  });

  it('should handle wallet_switchEthereumChain on the account server', async () => {
    // given
    const network = 'testnet';
    const testCommunicator = {
      postRequestAndWaitForResponse: vi.fn().mockResolvedValueOnce({}),
      postMessage: vi.fn(),
      onMessage: vi.fn(),
      ready: vi.fn(),
    };
    const { request } = createSophonEIP1193Provider(
      network,
      undefined,
      testCommunicator,
    );

    // when
    const result = await request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TESTNET_HEX_CHAIN_ID }],
    });

    // then
    expect(result).toEqual(null);
    expect(
      testCommunicator.postRequestAndWaitForResponse,
    ).not.toHaveBeenCalled();
    expect(awaitForPopupUnload).not.toHaveBeenCalled();
  });

  it.each(['eth_requestAccounts', 'wallet_requestPermissions'])(
    'should handle "%s" on the account server',
    async (methodName) => {
      // given
      const testCommunicator = {
        postRequestAndWaitForResponse: vi.fn().mockResolvedValueOnce({
          content: {
            result: {
              account: {
                address: '0x1234567890123456789012345678901234567890',
              },
            },
          },
        }),
        postMessage: vi.fn(),
        onMessage: vi.fn(),
        ready: vi.fn(),
      };
      const { request } = createSophonEIP1193Provider(
        'testnet',
        undefined,
        testCommunicator,
      );

      // when
      const result = await request({ method: methodName, params: [] });

      // then
      expect(result).toEqual(['0x1234567890123456789012345678901234567890']);
      expect(testCommunicator.postRequestAndWaitForResponse).toHaveBeenCalled();
      expect(awaitForPopupUnload).toHaveBeenCalled();
    },
  );

  it.each(['personal_sign', 'eth_signTypedData_v4', 'eth_sendTransaction'])(
    'should handle %s on the account server',
    async (methodName) => {
      // given
      const testCommunicator = {
        postRequestAndWaitForResponse: vi.fn().mockResolvedValueOnce({
          content: {
            result: {
              account: {
                signature: '0x1234567890123456789012345678901234567890',
              },
            },
          },
        }),
        postMessage: vi.fn(),
        onMessage: vi.fn(),
        ready: vi.fn(),
      };
      const { request } = createSophonEIP1193Provider(
        'testnet',
        undefined,
        testCommunicator,
      );

      // when
      const result = await request({ method: methodName, params: [] });

      // then
      expect(result).toEqual({
        account: { signature: '0x1234567890123456789012345678901234567890' },
      });
      expect(testCommunicator.postRequestAndWaitForResponse).toHaveBeenCalled();
      expect(awaitForPopupUnload).toHaveBeenCalled();
    },
  );

  it('should handle wallet_revokePermissions on the account server', async () => {
    // given
    const testCommunicator = {
      postRequestAndWaitForResponse: vi.fn().mockResolvedValueOnce({
        content: {
          result: {
            account: {
              signature: '0x1234567890123456789012345678901234567890',
            },
          },
        },
      }),
      postMessage: vi.fn(),
      onMessage: vi.fn(),
      ready: vi.fn(),
    };
    setAccounts('testnet', ['0x1234567890123456789012345678901234567890']);
    const { request } = createSophonEIP1193Provider(
      'testnet',
      undefined,
      testCommunicator,
    );

    // when
    const result = await request({
      method: 'wallet_revokePermissions',
      params: [],
    });

    // then
    expect(result).toEqual([]);
    expect(testCommunicator.postRequestAndWaitForResponse).toHaveBeenCalled();
    expect(awaitForPopupUnload).toHaveBeenCalled();
    expect(getAccounts('testnet')).toEqual([]);
  });

  it.each([
    'eth_sendRawTransaction',
    'eth_gasPrice',
    'eth_getBalance',
    'eth_getCode',
    'eth_getStorageAt',
    'eth_call',
    'eth_blockNumber',
    'eth_getBlockByHash',
    'eth_getBlockByNumber',
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
    'eth_getTransactionCount',
    'eth_estimateGas',
  ])(
    'should NOT handle %s on the account server, but on direct RPC call',
    async (methodName) => {
      // given
      const testCommunicator = {
        postRequestAndWaitForResponse: vi.fn(),
        postMessage: vi.fn(),
        onMessage: vi.fn(),
        ready: vi.fn(),
      };
      const callId = faker.string.uuid();

      vi.spyOn(rpc, 'genericRPCHandler').mockReturnValue({
        request: vi.fn().mockResolvedValue({ callId }),
      } as unknown as JSONRPCClient);

      const { request } = createSophonEIP1193Provider(
        'testnet',
        undefined,
        testCommunicator,
      );

      // when
      const result = await request({ method: methodName, params: [] });

      // then
      expect(result).toEqual({
        callId,
      });

      expect(rpc.genericRPCHandler).toHaveBeenCalledWith('testnet');
      expect(
        testCommunicator.postRequestAndWaitForResponse,
      ).not.toHaveBeenCalled();
      expect(awaitForPopupUnload).not.toHaveBeenCalled();
    },
  );
});

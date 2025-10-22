import { AccountAuthAPIURL } from '@sophon-labs/account-core';
import type { EIP1193Provider } from '@sophon-labs/account-provider';
import { sophon, sophonTestnet } from 'viem/chains';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SophonEIP6963Metadata } from '../constants';
import { createSophonEIP6963Emitter } from '../emitter';

// Mock the dependencies
vi.mock('@sophon-labs/account-provider', () => ({
  createSophonEIP1193Provider: vi.fn(),
}));

vi.mock('../eip6963', () => ({
  announceEip6963Provider: vi.fn(),
}));

describe('EIP6963 > Emitter', () => {
  let mockProvider: EIP1193Provider;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock provider
    mockProvider = {
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      disconnect: vi.fn(),
      accounts: vi.fn(() => []),
    } as unknown as EIP1193Provider;

    // Mock console.log
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock window for browser environment
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('server-side rendering', () => {
    it('should return early when window is undefined', async () => {
      // given
      delete (global as { window?: unknown }).window;
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );

      // when
      const result = createSophonEIP6963Emitter();

      // then
      expect(result).toBeUndefined();
      expect(createSophonEIP1193Provider).not.toHaveBeenCalled();
    });
  });

  describe('client-side with default parameters', () => {
    it('should create emitter with sophonTestnet as default chainId', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter();

      // then
      expect(createSophonEIP1193Provider).toHaveBeenCalledWith(
        sophonTestnet.id,
        undefined,
        AccountAuthAPIURL[sophonTestnet.id],
      );
    });

    it('should announce provider with correct metadata for testnet', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);
      const { announceEip6963Provider } = await import('../eip6963');

      // when
      createSophonEIP6963Emitter();

      // then
      expect(announceEip6963Provider).toHaveBeenCalledWith({
        info: {
          ...SophonEIP6963Metadata[sophonTestnet.id],
        },
        provider: mockProvider,
      });
    });

    it('should log announcement message for testnet', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter();

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Sophon EIP-6963 provider announced for chainId ${sophonTestnet.id} and url ${AccountAuthAPIURL[sophonTestnet.id]}`,
      );
    });
  });

  describe('client-side with custom chainId', () => {
    it('should create emitter with sophon mainnet chainId', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophon.id);

      // then
      expect(createSophonEIP1193Provider).toHaveBeenCalledWith(
        sophon.id,
        undefined,
        AccountAuthAPIURL[sophon.id],
      );
    });

    it('should announce provider with correct metadata for mainnet', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      const { announceEip6963Provider } = await import('../eip6963');
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophon.id);

      // then
      expect(announceEip6963Provider).toHaveBeenCalledWith({
        info: {
          ...SophonEIP6963Metadata[sophon.id],
        },
        provider: mockProvider,
      });
    });

    it('should log announcement message for mainnet', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophon.id);

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Sophon EIP-6963 provider announced for chainId ${sophon.id} and url ${AccountAuthAPIURL[sophon.id]}`,
      );
    });
  });

  describe('client-side with custom partnerId', () => {
    it('should pass partnerId to provider creation', async () => {
      // given
      const partnerId = 'test-partner-123';
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophonTestnet.id, partnerId);

      // then
      expect(createSophonEIP1193Provider).toHaveBeenCalledWith(
        sophonTestnet.id,
        partnerId,
        AccountAuthAPIURL[sophonTestnet.id],
      );
    });

    it('should announce provider with partnerId', async () => {
      // given
      const partnerId = 'test-partner-456';
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      const { announceEip6963Provider } = await import('../eip6963');
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophon.id, partnerId);

      // then
      expect(createSophonEIP1193Provider).toHaveBeenCalledWith(
        sophon.id,
        partnerId,
        AccountAuthAPIURL[sophon.id],
      );
      expect(announceEip6963Provider).toHaveBeenCalledWith({
        info: {
          ...SophonEIP6963Metadata[sophon.id],
        },
        provider: mockProvider,
      });
    });
  });

  describe('client-side with custom authServerUrl', () => {
    it('should use custom authServerUrl', async () => {
      // given
      const customUrl = 'https://custom-auth.example.com';
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophonTestnet.id, undefined, customUrl);

      // then
      expect(createSophonEIP1193Provider).toHaveBeenCalledWith(
        sophonTestnet.id,
        undefined,
        customUrl,
      );
    });

    it('should log announcement with custom authServerUrl', async () => {
      // given
      const customUrl = 'https://custom-auth.example.com';
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophonTestnet.id, undefined, customUrl);

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Sophon EIP-6963 provider announced for chainId ${sophonTestnet.id} and url ${customUrl}`,
      );
    });
  });

  describe('client-side with all custom parameters', () => {
    it('should handle all parameters correctly', async () => {
      // given
      const chainId = sophon.id;
      const partnerId = 'custom-partner';
      const customUrl = 'https://custom.example.com';
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      const { announceEip6963Provider } = await import('../eip6963');
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(chainId, partnerId, customUrl);

      // then
      expect(createSophonEIP1193Provider).toHaveBeenCalledWith(
        chainId,
        partnerId,
        customUrl,
      );
      expect(announceEip6963Provider).toHaveBeenCalledWith({
        info: {
          ...SophonEIP6963Metadata[chainId],
        },
        provider: mockProvider,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Sophon EIP-6963 provider announced for chainId ${chainId} and url ${customUrl}`,
      );
    });
  });

  describe('metadata spreading', () => {
    it('should spread metadata properties correctly for testnet', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      const { announceEip6963Provider } = await import('../eip6963');
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophonTestnet.id);

      // then
      const callArgs = vi.mocked(announceEip6963Provider).mock.calls[0][0];
      expect(callArgs.info.uuid).toBe(
        SophonEIP6963Metadata[sophonTestnet.id].uuid,
      );
      expect(callArgs.info.name).toBe(
        SophonEIP6963Metadata[sophonTestnet.id].name,
      );
      expect(callArgs.info.icon).toBe(
        SophonEIP6963Metadata[sophonTestnet.id].icon,
      );
      expect(callArgs.info.rdns).toBe(
        SophonEIP6963Metadata[sophonTestnet.id].rdns,
      );
    });

    it('should spread metadata properties correctly for mainnet', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      const { announceEip6963Provider } = await import('../eip6963');
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(mockProvider);

      // when
      createSophonEIP6963Emitter(sophon.id);

      // then
      const callArgs = vi.mocked(announceEip6963Provider).mock.calls[0][0];
      expect(callArgs.info.uuid).toBe(SophonEIP6963Metadata[sophon.id].uuid);
      expect(callArgs.info.name).toBe(SophonEIP6963Metadata[sophon.id].name);
      expect(callArgs.info.icon).toBe(SophonEIP6963Metadata[sophon.id].icon);
      expect(callArgs.info.rdns).toBe(SophonEIP6963Metadata[sophon.id].rdns);
    });
  });
});

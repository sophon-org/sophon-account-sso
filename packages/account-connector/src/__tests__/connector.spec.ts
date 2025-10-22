import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { sophon, sophonTestnet } from 'viem/chains';
import { toHex } from 'viem';
import { createSophonConnector } from '../connector';
import { SophonConnectorMetadata } from '../constants';
import type { EIP1193Provider } from '@sophon-labs/account-provider';
import { sophonOS, sophonOSTestnet } from '@sophon-labs/account-core';

// Mock the dependencies
vi.mock('@sophon-labs/account-provider', () => ({
  createSophonEIP1193Provider: vi.fn(),
}));

vi.mock('@wagmi/core', () => ({
  createConnector: vi.fn((fn) => fn),
  ChainNotConfiguredError: class ChainNotConfiguredError extends Error {
    constructor() {
      super('Chain not configured');
    }
  },
}));

describe('Connector > createSophonConnector', () => {
  let mockProvider: Partial<EIP1193Provider>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockConfig: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock provider
    mockProvider = {
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      disconnect: vi.fn(),
      accounts: vi.fn(() => ['0x1234567890123456789012345678901234567890']),
    };

    // Create mock config
    mockConfig = {
      chains: [sophon, sophonTestnet],
      emitter: {
        emit: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('connector configuration', () => {
    it.each([
      {
        chainId: sophon.id,
        description: 'mainnet',
      },
      {
        chainId: sophonTestnet.id,
        description: 'testnet',
      },
      {
        chainId: sophonOS.id,
        description: 'os mainnet',
      },
      {
        chainId: sophonOSTestnet.id,
        description: 'os testnet',
      },
    ])(
      'should create connector with correct properties for $description',
      ({ chainId }) => {
        // given
        const partnerId = 'test-partner';
        const expectedMetadata = SophonConnectorMetadata[chainId];

        // when
        const connector = createSophonConnector(chainId, partnerId);
        const connectorFn = connector(mockConfig);

        // then
        expect(connectorFn.id).toBe(expectedMetadata.id);
        expect(connectorFn.name).toBe(expectedMetadata.name);
        expect(connectorFn.icon).toBe(expectedMetadata.icon);
        expect(connectorFn.type).toBe(expectedMetadata.type);
      },
    );

    it('should use sophonTestnet as default chain when no chainId provided', () => {
      // given
      const partnerId = 'test-partner';
      const expectedMetadata = SophonConnectorMetadata[sophonTestnet.id];

      // when
      const connector = createSophonConnector(undefined, partnerId);
      const connectorFn = connector(mockConfig);

      // then
      expect(connectorFn.id).toBe(expectedMetadata.id);
      expect(connectorFn.name).toBe(expectedMetadata.name);
    });
  });

  describe('getChainId', () => {
    it('should return chain ID from provider', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockResolvedValue(sophon.id);

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when
      const chainId = await connectorFn.getChainId();

      // then
      expect(chainId).toBe(sophon.id);
      expect(mockProvider.request!).toHaveBeenCalledWith({
        method: 'eth_chainId',
      });
    });

    it('should return first chain from config when provider returns no chainId', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockResolvedValue(null);

      const connector = createSophonConnector(sophonTestnet.id);
      const connectorFn = connector(mockConfig);

      // when
      const chainId = await connectorFn.getChainId();

      // then
      expect(chainId).toBe(mockConfig.chains[0].id);
    });
  });

  describe('getAccounts', () => {
    it('should return normalized addresses from provider', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      const mockAddresses = [
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        '0x1234567890123456789012345678901234567890',
      ];
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockResolvedValue(mockAddresses);

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when
      const accounts = await connectorFn.getAccounts();

      // then
      expect(accounts).toHaveLength(2);
      expect(mockProvider.request!).toHaveBeenCalledWith({
        method: 'eth_accounts',
      });
      // Verify addresses are checksummed
      expect(accounts[0]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should return empty array when no accounts available', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockResolvedValue([]);

      const connector = createSophonConnector(sophonTestnet.id);
      const connectorFn = connector(mockConfig);

      // when
      const accounts = await connectorFn.getAccounts();

      // then
      expect(accounts).toEqual([]);
    });
  });

  describe('isAuthorized', () => {
    it('should return true when accounts are available', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      const mockAddresses = ['0x1234567890123456789012345678901234567890'];
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockResolvedValue(mockAddresses);

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when
      const isAuthorized = await connectorFn.isAuthorized();

      // then
      expect(isAuthorized).toBe(true);
    });

    it('should return false when no accounts available', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockResolvedValue([]);

      const connector = createSophonConnector(sophonTestnet.id);
      const connectorFn = connector(mockConfig);

      // when
      const isAuthorized = await connectorFn.isAuthorized();

      // then
      expect(isAuthorized).toBe(false);
    });

    it('should return false when getAccounts throws error', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockRejectedValue(
        new Error('Provider error'),
      );

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when
      const isAuthorized = await connectorFn.isAuthorized();

      // then
      expect(isAuthorized).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should call provider disconnect and cleanup listeners', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // First get provider to initialize it
      await connectorFn.getProvider();

      // when
      await connectorFn.disconnect();

      // then
      expect(mockProvider.disconnect!).toHaveBeenCalled();
    });
  });

  describe('switchChain', () => {
    it('should switch to sophon mainnet successfully', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockResolvedValue(null);

      const connector = createSophonConnector(sophonTestnet.id);
      const connectorFn = connector(mockConfig);

      // when
      const result = await connectorFn.switchChain!({ chainId: sophon.id });

      // then
      expect(result).toEqual(sophon);
      expect(mockProvider.request!).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHex(sophon.id) }],
      });
    });

    it('should switch to sophon testnet successfully', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );
      vi.mocked(mockProvider.request!).mockResolvedValue(null);

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when
      const result = await connectorFn.switchChain!({
        chainId: sophonTestnet.id,
      });

      // then
      expect(result).toEqual(sophonTestnet);
      expect(mockProvider.request!).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHex(sophonTestnet.id) }],
      });
    });

    it('should throw error when switching to unsupported chain', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);
      const unsupportedChainId = 1; // Ethereum mainnet

      // when/then
      await expect(
        connectorFn.switchChain!({ chainId: unsupportedChainId }),
      ).rejects.toThrow();
    });
  });

  describe('getClient', () => {
    it('should throw error when wallet provider not initialized', async () => {
      // given
      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when/then - try to get client without initializing provider
      await expect(connectorFn.getClient!()).rejects.toThrow(
        'Wallet provider not initialized',
      );
    });

    it('should throw error when requesting client for unsupported chain', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // Initialize provider
      await connectorFn.getProvider();

      // when/then - request client for unsupported chain (Ethereum mainnet)
      await expect(connectorFn.getClient!({ chainId: 1 })).rejects.toThrow(
        'Chain with id 1 is not supported',
      );
    });

    it.each([
      { chain: sophon, description: 'Sophon mainnet' },
      { chain: sophonTestnet, description: 'Sophon testnet' },
    ])(
      'should create client for $description successfully',
      async ({ chain }) => {
        // given
        const { createSophonEIP1193Provider } = await import(
          '@sophon-labs/account-provider'
        );
        vi.mocked(createSophonEIP1193Provider).mockReturnValue(
          mockProvider as EIP1193Provider,
        );

        const connector = createSophonConnector(chain.id);
        const connectorFn = connector(mockConfig);

        // Initialize provider
        await connectorFn.getProvider();

        // when
        const client = await connectorFn.getClient!({ chainId: chain.id });

        // then
        expect(client).toBeDefined();
        expect(mockProvider.accounts!).toHaveBeenCalled();
      },
    );
  });

  describe('event handlers', () => {
    it('should emit change event when accounts change', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);
      const newAccounts = ['0x1234567890123456789012345678901234567890'];

      // when
      connectorFn.onAccountsChanged(newAccounts);

      // then
      expect(mockConfig.emitter.emit).toHaveBeenCalledWith('change', {
        accounts: expect.any(Array),
      });
    });

    it('should not emit change event when accounts array is empty', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when
      connectorFn.onAccountsChanged([]);

      // then
      expect(mockConfig.emitter.emit).not.toHaveBeenCalled();
    });

    it('should emit change event with new chainId when chain changes', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when
      connectorFn.onChainChanged(String(sophonTestnet.id));

      // then
      expect(mockConfig.emitter.emit).toHaveBeenCalledWith('change', {
        chainId: sophonTestnet.id,
      });
    });

    it('should emit disconnect event when disconnected', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const connector = createSophonConnector(sophon.id);
      const connectorFn = connector(mockConfig);

      // when
      await connectorFn.onDisconnect(new Error('Connection lost'));

      // then
      expect(mockConfig.emitter.emit).toHaveBeenCalledWith('disconnect');
    });
  });

  describe('provider initialization', () => {
    it('should create provider only once when called multiple times', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const connector = createSophonConnector(sophon.id, 'test-partner');
      const connectorFn = connector(mockConfig);

      // when - call getProvider multiple times
      await connectorFn.getProvider();
      await connectorFn.getProvider();
      await connectorFn.getProvider();

      // then - provider should be created only once
      expect(createSophonEIP1193Provider).toHaveBeenCalledTimes(1);
    });

    it('should pass correct parameters to provider factory', async () => {
      // given
      const { createSophonEIP1193Provider } = await import(
        '@sophon-labs/account-provider'
      );
      vi.mocked(createSophonEIP1193Provider).mockReturnValue(
        mockProvider as EIP1193Provider,
      );

      const partnerId = 'test-partner-id';
      const customUrl = 'https://custom-auth.example.com';
      const connector = createSophonConnector(sophon.id, partnerId, customUrl);
      const connectorFn = connector(mockConfig);

      // when
      await connectorFn.getProvider();

      // then
      expect(createSophonEIP1193Provider).toHaveBeenCalledWith(
        sophon.id,
        partnerId,
        customUrl,
        undefined,
      );
    });
  });
});

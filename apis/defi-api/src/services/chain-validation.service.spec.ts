import { Test, type TestingModule } from '@nestjs/testing';
import type { ISwapProvider } from '../interfaces/swap-provider.interface';
import type { ChainId } from '../types/common.types';
import { ChainValidationService } from './chain-validation.service';
import { ProviderRegistryService } from './provider-registry.service';

describe('ChainValidationService', () => {
  let service: ChainValidationService;
  let providerRegistry: jest.Mocked<ProviderRegistryService>;

  const mockProvider1: ISwapProvider = {
    providerId: 'provider1',
    name: 'Provider 1',
    supportedChains: [1, 10, 137] as ChainId[],
    prepareTransaction: jest.fn(),
    getTransactionStatus: jest.fn(),
    validateRequest: jest.fn(),
    isEnabled: jest.fn(() => true),
  };

  const mockProvider2: ISwapProvider = {
    providerId: 'provider2',
    name: 'Provider 2',
    supportedChains: [42161, 8453] as ChainId[],
    prepareTransaction: jest.fn(),
    getTransactionStatus: jest.fn(),
    validateRequest: jest.fn(),
    isEnabled: jest.fn(() => true),
  };

  beforeEach(async () => {
    const mockProviderRegistry = {
      getProvider: jest.fn(),
      getEnabledProviders: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ChainValidationService,
          useFactory: (providerRegistry: ProviderRegistryService) => {
            return new ChainValidationService(providerRegistry);
          },
          inject: [ProviderRegistryService],
        },
        {
          provide: ProviderRegistryService,
          useValue: mockProviderRegistry,
        },
      ],
    }).compile();

    service = module.get<ChainValidationService>(ChainValidationService);
    providerRegistry = module.get(ProviderRegistryService);
  });

  describe('getSupportedChains', () => {
    it('should return chains for specific provider', () => {
      providerRegistry.getProvider.mockReturnValue(mockProvider1);

      const result = service.getSupportedChains('provider1');

      expect(result).toEqual([1, 10, 137]);
      expect(providerRegistry.getProvider).toHaveBeenCalledWith('provider1');
    });

    it('should return all chains from enabled providers when no provider specified', () => {
      providerRegistry.getEnabledProviders.mockReturnValue([
        mockProvider1,
        mockProvider2,
      ]);

      const result = service.getSupportedChains();

      expect(result).toEqual(expect.arrayContaining([1, 10, 137, 42161, 8453]));
      expect(result).toHaveLength(5);
    });

    it('should return empty array for non-existent provider', () => {
      providerRegistry.getProvider.mockImplementation(() => {
        throw new Error('Provider not found');
      });

      const result = service.getSupportedChains('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('isChainSupported', () => {
    it('should return true if chain is supported by specific provider', () => {
      providerRegistry.getProvider.mockReturnValue(mockProvider1);

      const result = service.isChainSupported(1, 'provider1');

      expect(result).toBe(true);
    });

    it('should return false if chain is not supported by specific provider', () => {
      providerRegistry.getProvider.mockReturnValue(mockProvider1);

      const result = service.isChainSupported(42161, 'provider1');

      expect(result).toBe(false);
    });

    it('should return true if chain is supported by any enabled provider', () => {
      providerRegistry.getEnabledProviders.mockReturnValue([
        mockProvider1,
        mockProvider2,
      ]);

      const result = service.isChainSupported(42161);

      expect(result).toBe(true);
    });
  });

  describe('validateChainForProvider', () => {
    it('should return valid result for supported chain', () => {
      providerRegistry.getProvider.mockReturnValue(mockProvider1);

      const result = service.validateChainForProvider(1, 'provider1');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for unsupported chain', () => {
      providerRegistry.getProvider.mockReturnValue(mockProvider1);

      const result = service.validateChainForProvider(42161, 'provider1');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        'Chain 42161 is not supported by provider',
      );
    });

    it('should return error for non-existent provider', () => {
      providerRegistry.getProvider.mockImplementation(() => {
        throw new Error('Provider not found');
      });

      const result = service.validateChainForProvider(1, 'nonexistent');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Provider 'nonexistent' not found or disabled",
      );
    });
  });
});

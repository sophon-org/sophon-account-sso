import { Test, TestingModule } from '@nestjs/testing';
import { ProviderRegistryService } from './provider-registry.service';
import { ISwapProvider } from '../interfaces/swap-provider.interface';
import { TransactionType } from '../types/common.types';
import { SwapAPIError, ErrorCodes } from '../errors/swap-api.error';

describe('ProviderRegistryService', () => {
  let service: ProviderRegistryService;
  let mockProvider: ISwapProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderRegistryService],
    }).compile();

    service = module.get<ProviderRegistryService>(ProviderRegistryService);

    mockProvider = {
      providerId: 'test-provider',
      name: 'Test Provider',
      supportedChains: [1, 10],
      isEnabled: jest.fn().mockReturnValue(true),
      prepareTransaction: jest.fn(),
      getTransactionStatus: jest.fn(),
      validateRequest: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerProvider', () => {
    it('should register a provider successfully', () => {
      service.registerProvider(mockProvider);
      const providers = service.getAllProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0]).toBe(mockProvider);
    });
  });

  describe('getProvider', () => {
    beforeEach(() => {
      service.registerProvider(mockProvider);
    });

    it('should return a registered provider', () => {
      const provider = service.getProvider('test-provider');
      expect(provider).toBe(mockProvider);
    });

    it('should throw error for non-existent provider', () => {
      expect(() => service.getProvider('non-existent')).toThrow(SwapAPIError);
      try {
        service.getProvider('non-existent');
      } catch (error) {
        expect(error.code).toBe(ErrorCodes.PROVIDER_NOT_FOUND);
      }
    });

    it('should throw error for disabled provider', () => {
      (mockProvider.isEnabled as jest.Mock).mockReturnValue(false);
      expect(() => service.getProvider('test-provider')).toThrow(SwapAPIError);
      try {
        service.getProvider('test-provider');
      } catch (error) {
        expect(error.code).toBe(ErrorCodes.PROVIDER_DISABLED);
      }
    });
  });

  describe('selectBestProvider', () => {
    const mockRequest = {
      actionType: TransactionType.SWAP,
      sender: '0x1234567890123456789012345678901234567890',
      sourceChain: 1,
      destinationChain: 10,
      sourceToken: '0x1234567890123456789012345678901234567890',
      destinationToken: '0x1234567890123456789012345678901234567890',
      amount: BigInt('1000000000000000000'),
      slippage: 1,
    };

    beforeEach(() => {
      service.registerProvider(mockProvider);
    });

    it('should select provider when explicitly specified', () => {
      const provider = service.selectBestProvider(mockRequest, 'test-provider');
      expect(provider).toBe(mockProvider);
    });

    it('should select compatible provider automatically', () => {
      const provider = service.selectBestProvider(mockRequest);
      expect(provider).toBe(mockProvider);
    });

    it('should throw error when no compatible provider found', () => {
      const incompatibleRequest = {
        ...mockRequest,
        sourceChain: 999,
      };
      expect(() => service.selectBestProvider(incompatibleRequest)).toThrow(SwapAPIError);
      try {
        service.selectBestProvider(incompatibleRequest);
      } catch (error) {
        expect(error.code).toBe(ErrorCodes.UNSUPPORTED_ROUTE);
      }
    });
  });

  describe('getProviderSummary', () => {
    beforeEach(() => {
      service.registerProvider(mockProvider);
    });

    it('should return provider summary', () => {
      const summary = service.getProviderSummary();
      expect(summary).toHaveLength(1);
      expect(summary[0]).toEqual({
        providerId: 'test-provider',
        name: 'Test Provider',
        enabled: true,
        supportedChains: [1, 10],
      });
    });
  });
});
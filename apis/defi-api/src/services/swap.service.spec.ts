import { Test, TestingModule } from '@nestjs/testing';
import { GetStatusDto, PrepareTransactionDto } from '../dto/swap.dto';
import { ErrorCodes, SwapAPIError } from '../errors/swap-api.error';
import { TransactionStatus, TransactionType } from '../types/common.types';
import { LoggingService } from './logging.service';
import { ProviderRegistryService } from './provider-registry.service';
import { SwapService } from './swap.service';

describe('SwapService', () => {
  let service: SwapService;
  let mockProviderRegistry: jest.Mocked<ProviderRegistryService>;
  let _mockLoggingService: jest.Mocked<LoggingService>;

  const mockProvider = {
    providerId: 'test-provider',
    name: 'Test Provider',
    supportedChains: [1, 10],
    isEnabled: jest.fn().mockReturnValue(true),
    prepareTransaction: jest.fn(),
    getTransactionStatus: jest.fn(),
    validateRequest: jest.fn(),
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    const mockProviderRegistryService = {
      selectBestProvider: jest.fn().mockReturnValue(mockProvider),
      getProvider: jest.fn().mockReturnValue(mockProvider),
      getProviderSummary: jest.fn().mockReturnValue([]),
      getEnabledProviders: jest.fn().mockReturnValue([mockProvider]),
    };

    const mockLoggingServiceObj = {
      logProviderError: jest.fn(),
      logProviderInfo: jest.fn(),
      logProviderDebug: jest.fn(),
      logDebug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapService,
        {
          provide: ProviderRegistryService,
          useValue: mockProviderRegistryService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingServiceObj,
        },
      ],
    }).compile();

    service = module.get<SwapService>(SwapService);
    mockProviderRegistry = module.get(ProviderRegistryService);
    _mockLoggingService = module.get(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('prepareTransaction', () => {
    const mockDto: PrepareTransactionDto = {
      actionType: TransactionType.SWAP,
      sender: '0x1234567890123456789012345678901234567890',
      sourceChain: 1,
      destinationChain: 10,
      sourceToken: '0x1234567890123456789012345678901234567890',
      destinationToken: '0x1234567890123456789012345678901234567890',
      amount: '1000000000000000000',
      slippage: 1,
    };

    it('should prepare transaction successfully', async () => {
      const mockResponse = {
        transactionId: 'test-tx-id',
        provider: 'test-provider',
        transaction: {
          to: '0x1234567890123456789012345678901234567890',
          data: '0x',
          value: '0',
          chainId: 1,
        },
        fees: {
          gas: '21000',
          protocol: '1000',
          total: '22000',
        },
        estimatedTime: 300,
      };

      mockProvider.prepareTransaction.mockResolvedValue(mockResponse);

      const result = await service.prepareTransaction(mockDto);

      expect(result).toEqual(mockResponse);
      expect(mockProviderRegistry.selectBestProvider).toHaveBeenCalled();
      expect(mockProvider.prepareTransaction).toHaveBeenCalled();
    });

    it('should handle provider selection errors', async () => {
      mockProviderRegistry.selectBestProvider.mockImplementation(() => {
        throw new SwapAPIError(
          'No compatible provider found',
          ErrorCodes.UNSUPPORTED_ROUTE,
          'test',
        );
      });

      await expect(service.prepareTransaction(mockDto)).rejects.toThrow(
        SwapAPIError,
      );
    });

    it('should handle provider transaction preparation errors', async () => {
      mockProvider.prepareTransaction.mockRejectedValue(
        new SwapAPIError(
          'Provider error',
          ErrorCodes.PROVIDER_ERROR,
          'test-provider',
        ),
      );

      await expect(service.prepareTransaction(mockDto)).rejects.toThrow(
        SwapAPIError,
      );
    });

    it('should pass through paymaster options', async () => {
      const dtoWithPaymaster = {
        ...mockDto,
        paymaster: '0x1234567890123456789012345678901234567890',
        paymasterInput: '0xabcdef...',
      };

      const mockResponse = {
        transactionId: 'test-tx-id',
        provider: 'test-provider',
        transaction: {
          to: '0x1234567890123456789012345678901234567890',
          data: '0x',
          value: '0',
          chainId: 1,
        },
        fees: {
          gas: '21000',
          protocol: '1000',
          total: '22000',
        },
        estimatedTime: 300,
      };

      mockProvider.prepareTransaction.mockResolvedValue(mockResponse);

      await service.prepareTransaction(dtoWithPaymaster);

      const prepareTransactionCall =
        mockProvider.prepareTransaction.mock.calls[0][0];
      expect(prepareTransactionCall.options).toBeDefined();
      expect(prepareTransactionCall.options.paymaster).toBe(
        '0x1234567890123456789012345678901234567890',
      );
      expect(prepareTransactionCall.options.paymasterInput).toBe('0xabcdef...');
    });
  });

  describe('getTransactionStatus', () => {
    const mockStatusDto: GetStatusDto = {
      txHash: '0xabcdef1234567890',
      sourceChainId: 1,
      provider: 'test-provider',
    };

    it('should get transaction status successfully', async () => {
      const mockStatusResponse = {
        found: true,
        status: TransactionStatus.CONFIRMED,
        provider: 'test-provider',
        transaction: {
          hash: '0xabcdef1234567890',
          sourceChain: 1,
          destinationChain: 137,
          sourceToken: '0x1234567890123456789012345678901234567890',
          destinationToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          amount: '1000000000000000000',
          recipient: '0x1234567890123456789012345678901234567890',
        },
        fees: {
          gas: '100000',
          protocol: '1000000000000000',
          total: '1100000000000000',
        },
        timestamps: {
          initiated: new Date('2023-01-01T00:00:00Z'),
          confirmed: new Date('2023-01-01T00:01:00Z'),
          completed: new Date('2023-01-01T00:01:00Z'),
        },
        links: {
          explorer: 'https://etherscan.io/tx/0xabcdef1234567890',
        },
      };

      mockProvider.getTransactionStatus.mockResolvedValue(mockStatusResponse);

      const result = await service.getTransactionStatus(mockStatusDto);

      expect(result).toEqual(mockStatusResponse);
      expect(mockProviderRegistry.getProvider).toHaveBeenCalledWith(
        'test-provider',
      );
      expect(mockProvider.getTransactionStatus).toHaveBeenCalled();
    });

    it('should iterate through enabled providers when no provider specified', async () => {
      const dtoWithoutProvider = {
        txHash: '0xabcdef1234567890',
        sourceChainId: 1,
      };

      const mockStatusResponse = {
        found: true,
        status: TransactionStatus.PENDING,
        provider: 'test-provider',
        transaction: null,
        fees: null,
        timestamps: null,
        links: null,
      };

      mockProvider.getTransactionStatus.mockResolvedValue(mockStatusResponse);
      mockProviderRegistry.getEnabledProviders.mockReturnValue([mockProvider]);

      const result = await service.getTransactionStatus(dtoWithoutProvider);

      expect(result).toEqual(mockStatusResponse);
      expect(mockProviderRegistry.getEnabledProviders).toHaveBeenCalled();
      expect(mockProvider.getTransactionStatus).toHaveBeenCalled();
    });

    it('should throw error when no enabled providers available', async () => {
      const dtoWithoutProvider = {
        txHash: '0xabcdef1234567890',
        sourceChainId: 1,
      };

      mockProviderRegistry.getEnabledProviders.mockReturnValue([]);

      await expect(
        service.getTransactionStatus(dtoWithoutProvider),
      ).rejects.toThrow(SwapAPIError);
    });

    it('should throw error when transaction not found in any provider', async () => {
      const dtoWithoutProvider = {
        txHash: '0xnotfound',
        sourceChainId: 1,
      };

      const notFoundResponse = {
        found: false,
        status: TransactionStatus.PENDING,
        provider: 'test-provider',
        transaction: null,
        fees: null,
        timestamps: null,
        links: null,
      };

      mockProvider.getTransactionStatus.mockResolvedValue(notFoundResponse);
      mockProviderRegistry.getEnabledProviders.mockReturnValue([mockProvider]);

      await expect(
        service.getTransactionStatus(dtoWithoutProvider),
      ).rejects.toThrow(SwapAPIError);
    });

    it('should handle provider errors in status check', async () => {
      mockProvider.getTransactionStatus.mockRejectedValue(
        new SwapAPIError(
          'Transaction not found',
          ErrorCodes.TRANSACTION_NOT_FOUND,
          'test-provider',
        ),
      );

      await expect(service.getTransactionStatus(mockStatusDto)).rejects.toThrow(
        SwapAPIError,
      );
    });

    it('should handle provider not found error', async () => {
      mockProviderRegistry.getProvider.mockImplementation(() => {
        throw new SwapAPIError(
          'Provider not found',
          ErrorCodes.PROVIDER_NOT_FOUND,
          'unknown',
        );
      });

      const dtoWithUnknownProvider = {
        ...mockStatusDto,
        provider: 'unknown-provider',
      };

      await expect(
        service.getTransactionStatus(dtoWithUnknownProvider),
      ).rejects.toThrow(SwapAPIError);
    });
  });

  describe('getProviders', () => {
    it('should return providers summary', async () => {
      const mockSummary = [
        {
          providerId: 'test-provider',
          name: 'Test Provider',
          enabled: true,
          supportedChains: [1, 10],
        },
      ];

      mockProviderRegistry.getProviderSummary.mockReturnValue(mockSummary);

      const result = await service.getProviders();

      expect(result).toEqual({ providers: mockSummary });
      expect(mockProviderRegistry.getProviderSummary).toHaveBeenCalled();
    });

    it('should return empty array when no providers available', async () => {
      mockProviderRegistry.getProviderSummary.mockReturnValue([]);

      const result = await service.getProviders();

      expect(result).toEqual({ providers: [] });
    });
  });
});

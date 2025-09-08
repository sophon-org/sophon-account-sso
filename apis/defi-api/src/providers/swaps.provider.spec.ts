import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { ErrorCodes, SwapAPIError } from '../errors/swap-api.error';
import { LoggingService } from '../services/logging.service';
import { TransactionStatus, TransactionType } from '../types/common.types';
import { SwapActionRequest } from '../types/swaps.types';
import { UnifiedTransactionRequest } from '../types/unified.types';
import { SwapsProvider } from './swaps.provider';

interface MockAxiosInstance {
  get: jest.Mock;
  post: jest.Mock;
  defaults: { headers: Record<string, unknown> };
}

// Mock axios completely to prevent real HTTP requests
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

describe('SwapsProvider', () => {
  let provider: SwapsProvider;
  let configService: jest.Mocked<ConfigService>;
  let loggingService: jest.Mocked<LoggingService>;
  let mockAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockAxios = axios as jest.Mocked<typeof axios>;

    // Setup axios.create mock
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      defaults: { headers: {} },
    };

    mockAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    // Create mock config service with predefined implementation
    configService = {
      get: jest
        .fn()
        .mockImplementation((key: string, defaultValue?: string) => {
          const config: Record<string, string> = {
            SWAPS_BASE_URL_ACTION: 'https://api-v2.swaps.xyz/api',
            SWAPS_BASE_URL_STATUS: 'https://ghost.swaps.xyz/api/v2',
            SWAPS_API_KEY: 'test-api-key',
            SWAPS_ENABLED: 'true',
          };
          return config[key] !== undefined ? config[key] : defaultValue;
        }),
    } as jest.Mocked<ConfigService>;

    // Create mock logging service
    loggingService = {
      logger: {
        error: jest.fn(),
        log: jest.fn(),
        debug: jest.fn(),
      } as jest.Mocked<Logger>,
      logProviderError: jest.fn(),
      logProviderInfo: jest.fn(),
      logProviderDebug: jest.fn(),
      logDebug: jest.fn(),
    } as jest.Mocked<LoggingService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapsProvider,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: LoggingService,
          useValue: loggingService,
        },
      ],
    }).compile();

    provider = module.get<SwapsProvider>(SwapsProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Default mock for callSwapAPI to prevent real HTTP requests
    jest.spyOn(provider, 'callSwapAPI').mockImplementation(() => {
      throw new Error('callSwapAPI should be mocked in individual tests');
    });
  });

  describe('Basic Properties', () => {
    it('should have correct provider details', () => {
      expect(provider.providerId).toBe('swaps');
      expect(provider.name).toBe('Swaps.xyz');
      expect(provider.supportedChains).toContain(1); // Ethereum
      expect(provider.supportedChains).toContain(137); // Polygon
      expect(provider.supportedChains).toContain(42161); // Arbitrum
    });

    it('should be enabled when API key is provided', () => {
      expect(provider.isEnabled()).toBe(true);
    });

    it('should be disabled when API key is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SWAPS_API_KEY') return '';
        return 'some-value';
      });

      const disabledProvider = new SwapsProvider(configService, loggingService);
      expect(disabledProvider.isEnabled()).toBe(false);
    });
  });

  describe('validateRequest', () => {
    const createValidRequest = (): UnifiedTransactionRequest => ({
      actionType: TransactionType.SWAP,
      sender: '0x1234567890123456789012345678901234567890',
      sourceChain: 1,
      destinationChain: 137,
      sourceToken: '0xA0b86a33E6776f4dEf4096D2b9b3dCfd05f3b99f',
      destinationToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      amount: BigInt('1000000000000000000'),
      slippage: 1,
    });

    it('should validate a correct request', async () => {
      const request = createValidRequest();
      const result = await provider.validateRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject unsupported source chain', async () => {
      const request = createValidRequest();
      request.sourceChain = 999;

      const result = await provider.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Source chain 999 not supported');
    });

    it('should reject unsupported destination chain', async () => {
      const request = createValidRequest();
      request.destinationChain = 999;

      const result = await provider.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Destination chain 999 not supported');
    });

    it('should reject invalid slippage', async () => {
      const request = createValidRequest();
      request.slippage = 0.05; // Too low

      const result = await provider.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Slippage must be between 0.1% and 50%');
    });

    it('should reject zero amount', async () => {
      const request = createValidRequest();
      request.amount = BigInt('0');

      const result = await provider.validateRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than 0');
    });
  });

  describe('transformToSwapRequest', () => {
    it('should transform request with paymaster options correctly', () => {
      const request: UnifiedTransactionRequest = {
        actionType: TransactionType.SWAP,
        sender: '0x1234567890123456789012345678901234567890',
        sourceChain: 1,
        destinationChain: 137,
        sourceToken: '0xA0b86a33E6776f4dEf4096D2b9b3dCfd05f3b99f',
        destinationToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        amount: BigInt('1000000000000000000'),
        slippage: 1,
        options: {
          paymaster: '0x1234567890123456789012345678901234567890',
          paymasterInput: '0xabcdef...',
        },
      };

      // Use private method through bracket notation for testing
      const result = provider.transformToSwapRequest(request);

      expect(result.actionType).toBe('swap-action');
      expect(result.sender).toBe(request.sender);
      expect(result.paymaster).toBe(
        '0x1234567890123456789012345678901234567890',
      );
      expect(result.paymasterInput).toBe('0xabcdef...');
      expect(result.slippage).toBe(100); // Converted to bps
    });

    it('should transform request without paymaster options', () => {
      const request: UnifiedTransactionRequest = {
        actionType: TransactionType.SWAP,
        sender: '0x1234567890123456789012345678901234567890',
        sourceChain: 1,
        destinationChain: 137,
        sourceToken: '0xA0b86a33E6776f4dEf4096D2b9b3dCfd05f3b99f',
        destinationToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        amount: BigInt('1000000000000000000'),
        slippage: 1,
      };

      const result = provider.transformToSwapRequest(request);

      expect(result.actionType).toBe('swap-action');
      expect(result.paymaster).toBeUndefined();
      expect(result.paymasterInput).toBeUndefined();
    });

    it('should handle evm-calldata-tx action type', () => {
      const request: UnifiedTransactionRequest = {
        actionType: TransactionType.SWAP,
        sender: '0x1234567890123456789012345678901234567890',
        sourceChain: 1,
        destinationChain: 137,
        sourceToken: '0xA0b86a33E6776f4dEf4096D2b9b3dCfd05f3b99f',
        destinationToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        amount: BigInt('1000000000000000000'),
        slippage: 1,
        actionConfig: {
          contractAddress: '0x1234567890123456789012345678901234567890',
          chainId: 1,
          data: '0xabcdef...',
        },
        options: {
          paymaster: '0x1234567890123456789012345678901234567890',
        },
      };

      const result = provider.transformToSwapRequest(request);

      expect(result.actionType).toBe('evm-calldata-tx');
      expect(result.paymaster).toBe(
        '0x1234567890123456789012345678901234567890',
      );
    });
  });

  describe('transformToUnifiedStatusResponse', () => {
    it('should transform status response correctly', () => {
      const mockStatusResponse = {
        tx: {
          txId: 'test-tx-id',
          status: 'success',
          sender: '0x1234567890123456789012345678901234567890',
          srcChainId: 1,
          dstChainId: 137,
          srcTxHash: '0xabcdef...',
          srcTx: {
            gasUsed: '100000',
            timestamp: '1640995200',
            paymentToken: {
              address: '0xA0b86a33E6776f4dEf4096D2b9b3dCfd05f3b99f',
              amount: '1000000000000000000',
            },
            blockExplorer: 'https://etherscan.io',
          },
          dstTx: {
            gasUsed: '80000',
            timestamp: '1640995260',
          },
          bridgeDetails: {
            isBridge: true,
            bridgeTime: 300,
            txPath: [
              {
                chainId: 1,
                txHash: '0xabcdef...',
                timestamp: '1640995200',
              },
            ],
          },
        },
      };

      const result =
        provider.transformToUnifiedStatusResponse(mockStatusResponse);

      expect(result.found).toBe(true);
      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      expect(result.provider).toBe('swaps');
      expect(result.transaction.hash).toBe('0xabcdef...');
      expect(result.transaction.sourceChain).toBe(1);
      expect(result.transaction.destinationChain).toBe(137);
      expect(result.fees.gas).toBe('0'); // Swaps.xyz status API doesn't provide gas info
      expect(result.fees.total).toBe('0'); // No fee info available in status endpoint
      expect(result.links.explorer).toBe('https://etherscan.io');
      expect(result.links.providerTracker).toBe(
        'https://swaps.xyz/tx/0xabcdef...',
      );
    });

    it('should handle missing transaction data', () => {
      const emptyResponse = { tx: null };

      const result = provider.transformToUnifiedStatusResponse(emptyResponse);

      expect(result.found).toBe(false);
      expect(result.status).toBe(TransactionStatus.PENDING);
    });

    it('should map different status values correctly', () => {
      const testCases = [
        { status: 'success', expected: TransactionStatus.CONFIRMED },
        { status: 'failed', expected: TransactionStatus.FAILED },
        { status: 'pending', expected: TransactionStatus.PENDING },
        { status: 'unknown', expected: TransactionStatus.PENDING },
      ];

      testCases.forEach(({ status, expected }) => {
        const response = {
          tx: {
            txId: 'test-id',
            status,
            srcTxHash: '0xtest',
            srcChainId: 1,
            dstChainId: 137,
            sender: '0x123',
            bridgeDetails: {
              isBridge: false,
              txPath: [],
            },
          },
        };

        const result = provider.transformToUnifiedStatusResponse(response);
        expect(result.status).toBe(expected);
      });
    });

    it('should calculate protocol fees from org.appFees', () => {
      const mockStatusResponse = {
        tx: {
          txId: 'test-tx-id',
          status: 'success',
          sender: '0x1234567890123456789012345678901234567890',
          srcChainId: 1,
          dstChainId: 137,
          srcTxHash: '0xabcdef...',
          srcTx: {
            gasUsed: '100000',
            timestamp: '1640995200',
          },
          dstTx: {
            gasUsed: '80000',
            timestamp: '1640995260',
          },
          org: {
            appId: 'test-app',
            appFees: [
              { recipient: '0x123...', token: '0xA0b...', amount: '5000' },
              { recipient: '0x456...', token: '0xB1c...', amount: '3000' },
            ],
          },
        },
      };

      const result =
        provider.transformToUnifiedStatusResponse(mockStatusResponse);

      expect(result.fees.protocol).toBe('0'); // Swaps.xyz status API doesn't provide protocol fees
      expect(result.fees.total).toBe('0'); // No fee info available in status endpoint
    });

    it('should generate explorer link from chain mapping when API doesnt provide blockExplorer', () => {
      const mockStatusResponse = {
        tx: {
          txId: 'test-tx-id',
          status: 'success',
          sender: '0x1234567890123456789012345678901234567890',
          srcChainId: 50104, // Sophon
          dstChainId: 324,
          srcTxHash: '0xabcdef123456789...',
          srcTx: {
            gasUsed: '100000',
            timestamp: '1640995200',
            // No blockExplorer provided
          },
        },
      };

      const result =
        provider.transformToUnifiedStatusResponse(mockStatusResponse);

      expect(result.links.explorer).toBe(
        'https://explorer.sophon.xyz/tx/0xabcdef123456789...',
      );
      expect(result.links.providerTracker).toBe(
        'https://swaps.xyz/tx/0xabcdef123456789...',
      );
    });
  });

  describe('parseAmountValue', () => {
    it('should parse string amounts correctly', () => {
      const testCases = [
        { input: '1000000000000000000', expected: '1000000000000000000' },
        { input: '1000000000000000000n', expected: '1000000000000000000' },
        { input: BigInt('500000000000000000'), expected: '500000000000000000' },
        { input: 123, expected: '123' },
        { input: null, expected: '0' },
        { input: undefined, expected: '0' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = provider.parseAmountValue(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('prepareTransaction', () => {
    const mockRequest: UnifiedTransactionRequest = {
      actionType: 'evm-send-tx',
      sender: '0x1234567890123456789012345678901234567890',
      sourceChain: 1,
      destinationChain: 10,
      sourceToken: '0x0000000000000000000000000000000000000000',
      destinationToken: '0x0000000000000000000000000000000000000000',
      amount: BigInt('1000000000000000000'),
      slippage: 1,
      recipient: '0x9876543210987654321098765432109876543210',
      options: {},
    };

    it('should handle validation errors', async () => {
      // Mock validation to fail - this should prevent callSwapAPI from being called
      jest.spyOn(provider, 'validateRequest').mockResolvedValue({
        isValid: false,
        errors: ['Invalid chain'],
      });

      await expect(provider.prepareTransaction(mockRequest)).rejects.toThrow(
        'Validation failed: Invalid chain',
      );

      expect(loggingService.logProviderDebug).toHaveBeenCalledWith(
        'swaps',
        'Starting prepareTransaction',
        expect.any(Object),
      );
    });

    it('should throw validation error for invalid request', async () => {
      // Mock validateRequest to return invalid result
      jest.spyOn(provider, 'validateRequest').mockResolvedValue({
        isValid: false,
        errors: ['Invalid token address', 'Unsupported chain'],
      });

      const invalidRequest = { ...mockRequest };

      await expect(provider.prepareTransaction(invalidRequest)).rejects.toThrow(
        'Validation failed: Invalid token address, Unsupported chain',
      );

      expect(loggingService.logProviderDebug).toHaveBeenCalledWith(
        'swaps',
        'Request validation completed',
        {
          isValid: false,
          errors: ['Invalid token address', 'Unsupported chain'],
        },
      );
    });

    it('should handle API errors during transaction preparation', async () => {
      // Mock successful validation but API error
      jest.spyOn(provider, 'validateRequest').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      // Mock the callSwapAPI method to simulate network error
      jest
        .spyOn(provider, 'callSwapAPI')
        .mockRejectedValue(new Error('Network error'));

      await expect(provider.prepareTransaction(mockRequest)).rejects.toThrow(
        'Failed to prepare transaction with Swaps.xyz',
      );
    });

    it('should successfully prepare transaction with valid response', async () => {
      // Mock successful validation
      jest.spyOn(provider, 'validateRequest').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      // Mock successful API response
      const mockApiResponse = {
        tx: {
          to: '0x1234567890123456789012345678901234567890',
          data: '0x123456789',
          value: '1000000000000000000',
          gasLimit: '21000',
          chainId: 1,
        },
        txId: '0xabcdef1234567890',
        VmId: 'evm',
        amountIn: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '1000000000000000000',
        },
        amountInMax: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '1000000000000000000',
        },
        amountOut: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 10,
          amount: '990000000000000000',
        },
        amountOutMin: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 10,
          amount: '980000000000000000',
        },
        protocolFee: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '1000000000000000',
        },
        applicationFee: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '0',
        },
        bridgeFee: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '0',
        },
        exchangeRate: 0.99,
        estimatedTxTime: 300,
        estimatedPriceImpact: 0.01,
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue(mockApiResponse);

      const result = await provider.prepareTransaction(mockRequest);

      expect(result).toEqual({
        transactionId: '0xabcdef1234567890',
        provider: 'swaps',
        transaction: {
          to: '0x1234567890123456789012345678901234567890',
          data: '0x123456789',
          value: '1000000000000000000',
          chainId: 1,
        },
        fees: {
          gas: '21000',
          protocol: '1000000000000000',
          total: '1000000000000000',
        },
        estimatedTime: 300,
        exchangeRate: 0.99,
        requiredApprovals: [],
      });
    });

    it('should handle missing transaction data in response', async () => {
      jest.spyOn(provider, 'validateRequest').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      // Mock API response without tx field
      const mockApiResponse = {
        txId: '0xabcdef1234567890',
        estimatedTxTime: 300,
        // Missing tx field
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue(mockApiResponse);

      await expect(provider.prepareTransaction(mockRequest)).rejects.toThrow(
        'Failed to prepare transaction with Swaps.xyz',
      );
    });

    it('should handle API error responses', async () => {
      jest.spyOn(provider, 'validateRequest').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      // Mock API error response
      const mockApiResponse = {
        success: false,
        error: {
          message: 'Invalid token address',
          code: 'INVALID_TOKEN',
          details: { field: 'srcToken' },
        },
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue(mockApiResponse);

      await expect(provider.prepareTransaction(mockRequest)).rejects.toThrow(
        'Swaps.xyz API Error: Invalid token address',
      );
      expect(loggingService.logProviderDebug).toHaveBeenCalledWith(
        'swaps',
        'API returned error response',
        { error: mockApiResponse.error },
      );
    });

    it('should handle response with BigInt values', async () => {
      jest.spyOn(provider, 'validateRequest').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      // Mock API response with BigInt values
      const mockApiResponse = {
        tx: {
          to: '0x1234567890123456789012345678901234567890',
          data: '0x123456789',
          value: BigInt('1000000000000000000').toString(), // This will test BigInt serialization
          gasLimit: '21000',
          chainId: 1,
        },
        txId: '0xabcdef1234567890',
        VmId: 'evm',
        amountIn: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: BigInt('1000000000000000000'), // This will test BigInt handling
        },
        amountOut: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 10,
          amount: '990000000000000000',
        },
        amountInMax: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '1000000000000000000',
        },
        amountOutMin: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 10,
          amount: '980000000000000000',
        },
        protocolFee: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '1000000000000000',
        },
        applicationFee: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '0',
        },
        bridgeFee: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: 1,
          amount: '0',
        },
        exchangeRate: 0.99,
        estimatedTxTime: 300,
        estimatedPriceImpact: 0.01,
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue(mockApiResponse);

      const result = await provider.prepareTransaction(mockRequest);
      expect(result.transactionId).toBe('0xabcdef1234567890');
      expect(result.transaction.value).toBe('1000000000000000000');
    });

    it('should rethrow SwapAPIError from prepareTransaction', async () => {
      jest.spyOn(provider, 'validateRequest').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const swapApiError = new SwapAPIError(
        'Network timeout',
        ErrorCodes.NETWORK_ERROR,
        'swaps',
      );
      jest.spyOn(provider, 'callSwapAPI').mockRejectedValue(swapApiError);

      await expect(provider.prepareTransaction(mockRequest)).rejects.toThrow(
        swapApiError,
      );
    });
  });

  describe('getTransactionStatus', () => {
    const mockStatusRequest = {
      transactionHash: '0xabcdef1234567890',
      sourceChainId: 1,
      provider: 'swaps',
    };

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      jest.spyOn(provider, 'callSwapAPI').mockRejectedValue(mockError);

      await expect(
        provider.getTransactionStatus(mockStatusRequest),
      ).rejects.toThrow();
      // The error logging happens in the wrapped error, so let's just check the error is thrown
    });

    it('should handle empty response gracefully', async () => {
      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue({ data: null });

      const result = await provider.getTransactionStatus(mockStatusRequest);
      expect(result.found).toBe(false);
      expect(result.status).toBe(TransactionStatus.PENDING);
    });

    it('should successfully get transaction status with complete data', async () => {
      const mockResponse = {
        tx: {
          txId: 'swap-123',
          status: 'success',
          sender: '0x1234567890123456789012345678901234567890',
          srcChainId: 1,
          dstChainId: 10,
          srcTxHash: '0xabcdef1234567890',
          srcTx: {
            gasUsed: '21000',
            timestamp: '1640995200',
            blockExplorer: 'https://etherscan.io/tx/0xabcdef1234567890',
          },
          dstTx: {
            gasUsed: '50000',
            timestamp: '1640995260',
            txHash: '0x9876543210987654',
          },
          bridgeDetails: {
            isBridge: true,
            txPath: [
              { chainId: 1, txHash: '0xabcdef1234567890' },
              { chainId: 10, txHash: '0x9876543210987654' },
            ],
          },
        },
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue(mockResponse);

      const result = await provider.getTransactionStatus(mockStatusRequest);

      expect(result.found).toBe(true);
      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      expect(result.transaction.sourceChain).toBe(1);
      expect(result.transaction.destinationChain).toBe(10);
      expect(result.links.explorer).toBe(
        'https://etherscan.io/tx/0xabcdef1234567890',
      );
    });

    it('should handle failed transaction status', async () => {
      const mockResponse = {
        tx: {
          txId: 'swap-456',
          status: 'failed',
          sender: '0x1234567890123456789012345678901234567890',
          srcChainId: 1,
          dstChainId: 10,
          srcTxHash: '0xabcdef1234567890',
          bridgeDetails: {
            isBridge: false,
            txPath: [],
          },
        },
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue(mockResponse);

      const result = await provider.getTransactionStatus(mockStatusRequest);

      expect(result.found).toBe(true);
      expect(result.status).toBe(TransactionStatus.FAILED);
    });

    it('should handle pending transaction status', async () => {
      const mockResponse = {
        tx: {
          txId: 'swap-789',
          status: 'pending',
          sender: '0x1234567890123456789012345678901234567890',
          srcChainId: 1,
          dstChainId: 10,
          srcTxHash: '0xabcdef1234567890',
          bridgeDetails: {
            isBridge: false,
            txPath: [],
          },
        },
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue(mockResponse);

      const result = await provider.getTransactionStatus(mockStatusRequest);

      expect(result.found).toBe(true);
      expect(result.status).toBe(TransactionStatus.PENDING);
    });

    it('should rethrow SwapAPIError from getTransactionStatus', async () => {
      const swapApiError = new SwapAPIError(
        'API limit exceeded',
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'swaps',
      );
      jest.spyOn(provider, 'callSwapAPI').mockRejectedValue(swapApiError);

      await expect(
        provider.getTransactionStatus(mockStatusRequest),
      ).rejects.toThrow(swapApiError);
      // SwapAPIError is rethrown directly, so logProviderError is not called
    });

    it('should handle missing tracker URL in status response', async () => {
      const mockResponse = {
        tx: {
          txId: 'swap-no-tracker',
          status: 'success',
          sender: '0x1234567890123456789012345678901234567890',
          srcChainId: 1,
          dstChainId: 10,
          // Remove srcTxHash to test missing tracker URL scenario
          bridgeDetails: {
            isBridge: false,
            txPath: [],
          },
        },
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue(mockResponse);

      const result = await provider.getTransactionStatus(mockStatusRequest);

      expect(result.found).toBe(true);
      expect(result.links.providerTracker).toBe('');
      expect(loggingService.logProviderDebug).toHaveBeenCalledWith(
        'swaps',
        'No tracker link generated - missing txHash',
      );
    });
  });

  describe('configuration edge cases', () => {
    it('should handle missing base URL', async () => {
      const configServiceNoUrl = {
        get: jest
          .fn()
          .mockImplementation((key: string, defaultValue?: string) => {
            const config: Record<string, string> = {
              SWAPS_API_KEY: 'test-api-key',
              SWAPS_ENABLED: 'true',
              SWAPS_BASE_URL_ACTION: '',
              SWAPS_BASE_URL_STATUS: '',
            };
            return config[key] !== undefined ? config[key] : defaultValue;
          }),
      } as jest.Mocked<ConfigService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SwapsProvider,
          { provide: ConfigService, useValue: configServiceNoUrl },
          { provide: LoggingService, useValue: loggingService },
        ],
      }).compile();

      const providerNoUrl = module.get<SwapsProvider>(SwapsProvider);
      expect(providerNoUrl.isEnabled()).toBe(true); // It's enabled because it has API key and is enabled
    });

    it('should handle default configuration values', async () => {
      const configServiceDefaults = {
        get: jest.fn().mockReturnValue(undefined),
      } as jest.Mocked<ConfigService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SwapsProvider,
          { provide: ConfigService, useValue: configServiceDefaults },
          { provide: LoggingService, useValue: loggingService },
        ],
      }).compile();

      const providerDefaults = module.get<SwapsProvider>(SwapsProvider);
      expect(providerDefaults.isEnabled()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle malformed API responses', async () => {
      const mockStatusRequest = {
        transactionHash: '0xabcdef1234567890',
        sourceChainId: 1,
        provider: 'swaps',
      };

      jest.spyOn(provider, 'callSwapAPI').mockResolvedValue({
        data: { malformed: true },
      });

      const result = await provider.getTransactionStatus(mockStatusRequest);
      expect(result.found).toBe(false);
    });
  });

  describe('Helper methods', () => {
    it('should generate explorer link correctly', () => {
      const result = provider.generateExplorerLink(1, '0xabcdef1234567890');
      expect(result).toBe('https://etherscan.io/tx/0xabcdef1234567890');
    });

    it('should return empty string for unsupported chains', () => {
      const result = provider.generateExplorerLink(999, '0xabcdef1234567890');
      expect(result).toBe('');
      expect(loggingService.logProviderDebug).toHaveBeenCalledWith(
        'swaps',
        'No explorer link could be generated',
      );
    });

    describe('callSwapAPI method', () => {
      // These tests directly test the callSwapAPI method, so they need to remove the global mock
      beforeEach(() => {
        // Remove the global mock for these specific tests
        jest.restoreAllMocks();
      });

      it('should handle API key missing error', async () => {
        const providerNoApiKey = new SwapsProvider(
          {
            get: jest.fn().mockImplementation((_key: string) => {
              return ''; // No API key
            }),
          } as Partial<ConfigService>,
          loggingService,
        );

        await expect(
          providerNoApiKey.callSwapAPI('/getAction', {} as SwapActionRequest),
        ).rejects.toThrow('Swaps.xyz API key not configured');
      });

      it('should handle GET requests successfully', async () => {
        const mockResponse = { data: { success: true } };
        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn().mockResolvedValue(mockResponse),
          post: jest.fn(),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        // Test simple GET path (not /getStatus which uses different configuration)
        const result = await provider.callSwapAPI('/getStatus', {
          chainId: 1,
          txHash: '0x123',
        });

        expect(result).toEqual({ success: true });
        expect(axios.create).toHaveBeenCalledWith({
          headers: {
            'x-api-key': 'test-api-key',
          },
          timeout: 30000,
        });
      });

      it('should handle POST requests successfully', async () => {
        const mockResponse = { data: { txId: 'test' } };
        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn(),
          post: jest.fn().mockResolvedValue(mockResponse),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        const result = await provider.callSwapAPI('/someOtherEndpoint', {
          amount: '100',
        } as SwapActionRequest);

        expect(result).toEqual({ txId: 'test' });
      });

      it('should handle network errors with response details', async () => {
        const errorWithResponse = {
          message: 'Request failed',
          response: {
            status: 400,
            statusText: 'Bad Request',
            headers: { 'content-type': 'application/json' },
            data: { error: 'Invalid request' },
          },
          config: {
            url: 'https://api.swaps.xyz/swap',
            method: 'post',
            timeout: 30000,
          },
        };

        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn().mockRejectedValue(errorWithResponse),
          post: jest.fn(),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        await expect(
          provider.callSwapAPI('/getAction', {
            amount: '100',
          } as SwapActionRequest),
        ).rejects.toThrow('Swaps.xyz API call failed: Request failed');
      });

      it('should handle /getAction endpoint path', async () => {
        const mockResponse = { data: { txId: '0xabc', tx: { to: '0x123' } } };
        const mockActionData = {
          sender: '0x123',
          amount: BigInt('1000000000000000000'),
          sourceToken: '0xA0b86a33E6416c3C91e01a2D2d40e0E9f1b25C81',
        };

        // Mock axios.create for actionClient
        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn().mockResolvedValue(mockResponse),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        const result = await provider.callSwapAPI('/getAction', mockActionData);

        expect(result).toEqual({ txId: '0xabc', tx: { to: '0x123' } });
        expect(axios.create).toHaveBeenCalledWith({
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
          },
          timeout: 30000,
        });
      });

      it('should handle /getStatus endpoint path', async () => {
        const mockResponse = { data: { tx: { status: 'completed' } } };
        const mockStatusData = {
          chainId: 1,
          txHash: '0xabcdef1234567890',
        };

        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn().mockResolvedValue(mockResponse),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        const result = await provider.callSwapAPI('/getStatus', mockStatusData);

        expect(result).toEqual({ tx: { status: 'completed' } });
        expect(axios.create).toHaveBeenCalledWith({
          headers: {
            'x-api-key': 'test-api-key',
          },
          timeout: 30000,
        });
      });
    });

    describe('healthCheck', () => {
      beforeEach(() => {
        jest.restoreAllMocks();
      });

      it('should return unhealthy when provider is disabled', async () => {
        const disabledProvider = new SwapsProvider(
          {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'SWAPS_API_KEY') return '';
              return 'some-value';
            }),
          } as Partial<ConfigService>,
          loggingService,
        );

        const result = await disabledProvider.healthCheck();

        expect(result.healthy).toBe(false);
        expect(result.error).toBe('Provider is disabled or missing API key');
        expect(result.timestamp).toBeInstanceOf(Date);
      });

      it('should return healthy when API responds successfully', async () => {
        const mockError = {
          response: {
            status: 401,
            data: { error: 'Unauthorized: No API key provided.' },
          },
          message: 'Request failed with status code 401',
        };
        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn().mockRejectedValue(mockError),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        const result = await provider.healthCheck();

        expect(result.healthy).toBe(true);
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(loggingService.logProviderDebug).toHaveBeenCalledWith(
          'swaps',
          'Health check passed (API responding with expected error)',
          { responseTime: expect.any(Number), status: 401 },
        );
      });

      it('should return healthy when API responds with 404 error', async () => {
        const mockError = {
          response: {
            status: 404,
            data: { error: 'Not found' },
          },
          message: 'Request failed with status code 404',
        };
        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn().mockRejectedValue(mockError),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        const result = await provider.healthCheck();

        expect(result.healthy).toBe(true);
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(loggingService.logProviderDebug).toHaveBeenCalledWith(
          'swaps',
          'Health check passed (API responding with expected error)',
          { responseTime: expect.any(Number), status: 404 },
        );
      });

      it('should return healthy when API responds with 400 error (API is working)', async () => {
        const mock400Error = {
          response: {
            status: 400,
            data: { error: 'Bad Request' },
          },
          message: 'Request failed with status code 400',
        };

        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn().mockRejectedValue(mock400Error),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        const result = await provider.healthCheck();

        expect(result.healthy).toBe(true);
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(loggingService.logProviderDebug).toHaveBeenCalledWith(
          'swaps',
          'Health check passed (API responding with expected error)',
          { responseTime: expect.any(Number), status: 400 },
        );
      });

      it('should return unhealthy when API call fails with network error', async () => {
        const mockError = new Error('Network timeout');
        jest.spyOn(axios, 'create').mockReturnValue({
          get: jest.fn().mockRejectedValue(mockError),
          defaults: { headers: {} },
        } as MockAxiosInstance);

        const result = await provider.healthCheck();

        expect(result.healthy).toBe(false);
        expect(result.error).toBe('Network timeout');
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(loggingService.logProviderError).toHaveBeenCalledWith(
          'swaps',
          'Health check failed: Network timeout',
          {
            responseTime: expect.any(Number),
            error: 'Network timeout',
            status: undefined,
          },
        );
      });
    });
  });
});

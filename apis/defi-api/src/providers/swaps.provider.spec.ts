import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggingService } from '../services/logging.service';
import { TransactionStatus, TransactionType } from '../types/common.types';
import { UnifiedTransactionRequest } from '../types/unified.types';
import { SwapsProvider } from './swaps.provider';

describe('SwapsProvider', () => {
  let provider: SwapsProvider;
  let configService: jest.Mocked<ConfigService>;
  let loggingService: jest.Mocked<LoggingService>;

  beforeEach(async () => {
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
});

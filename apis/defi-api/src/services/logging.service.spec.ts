import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(() => {
    service = new LoggingService();

    // Mock the internal logger to prevent actual logging
    service.logger = {
      error: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
    } as jest.Mocked<typeof service.logger>;
  });

  describe('logProviderError', () => {
    it('should log provider error with providerId and message', () => {
      const providerId = 'test-provider';
      const errorMessage = 'API call failed';
      const metadata = { statusCode: 500, endpoint: '/api/test' };

      service.logProviderError(providerId, errorMessage, metadata);

      expect(service.logger.error).toHaveBeenCalledWith(
        `Provider ${providerId} error: ${errorMessage}`,
        metadata,
      );
    });

    it('should log provider error without metadata', () => {
      const providerId = 'test-provider';
      const errorMessage = 'Network timeout';

      service.logProviderError(providerId, errorMessage);

      expect(service.logger.error).toHaveBeenCalledWith(
        `Provider ${providerId} error: ${errorMessage}`,
        undefined,
      );
    });

    it('should handle empty error message', () => {
      const providerId = 'test-provider';
      const errorMessage = '';

      service.logProviderError(providerId, errorMessage);

      expect(service.logger.error).toHaveBeenCalledWith(
        `Provider ${providerId} error: `,
        undefined,
      );
    });

    it('should handle complex metadata objects', () => {
      const providerId = 'swaps';
      const errorMessage = 'Transaction failed';
      const metadata = {
        transactionId: 'tx-123',
        sourceChain: 1,
        destinationChain: 137,
        amount: '1000000000000000000',
        error: {
          code: 'INSUFFICIENT_LIQUIDITY',
          details: 'Not enough liquidity for this trade',
        },
      };

      service.logProviderError(providerId, errorMessage, metadata);

      expect(service.logger.error).toHaveBeenCalledWith(
        `Provider ${providerId} error: ${errorMessage}`,
        metadata,
      );
    });
  });

  describe('logProviderInfo', () => {
    it('should log provider info with providerId and message', () => {
      const providerId = 'test-provider';
      const message = 'Transaction prepared successfully';
      const metadata = { transactionId: 'tx-123', estimatedTime: 30 };

      service.logProviderInfo(providerId, message, metadata);

      expect(service.logger.log).toHaveBeenCalledWith(
        `Provider ${providerId}: ${message}`,
        metadata,
      );
    });

    it('should log provider info without metadata', () => {
      const providerId = 'test-provider';
      const message = 'Provider enabled';

      service.logProviderInfo(providerId, message);

      expect(service.logger.log).toHaveBeenCalledWith(
        `Provider ${providerId}: ${message}`,
        undefined,
      );
    });

    it('should handle empty message', () => {
      const providerId = 'test-provider';
      const message = '';

      service.logProviderInfo(providerId, message);

      expect(service.logger.log).toHaveBeenCalledWith(
        `Provider ${providerId}: `,
        undefined,
      );
    });

    it('should handle transaction-related metadata', () => {
      const providerId = 'swaps';
      const message = 'Status check completed';
      const metadata = {
        transactionHash: '0xabcdef...',
        status: 'confirmed',
        sourceChain: 1,
        destinationChain: 137,
        fees: {
          gas: '100000',
          protocol: '1000000000000000',
          total: '1100000000000000',
        },
      };

      service.logProviderInfo(providerId, message, metadata);

      expect(service.logger.log).toHaveBeenCalledWith(
        `Provider ${providerId}: ${message}`,
        metadata,
      );
    });

    it('should handle null and undefined values in metadata', () => {
      const providerId = 'test-provider';
      const message = 'Test message';
      const metadata = {
        value1: null,
        value2: undefined,
        value3: 'valid-value',
      };

      service.logProviderInfo(providerId, message, metadata);

      expect(service.logger.log).toHaveBeenCalledWith(
        `Provider ${providerId}: ${message}`,
        metadata,
      );
    });
  });

  describe('logProviderDebug', () => {
    it('should log provider debug with providerId and message', () => {
      const providerId = 'testProvider';
      const message = 'Test debug message';

      service.logProviderDebug(providerId, message);

      expect(service.logger.debug).toHaveBeenCalledWith(
        `Provider ${providerId}: ${message}`,
        undefined,
      );
    });

    it('should log provider debug without metadata', () => {
      const providerId = 'testProvider';
      const message = 'Debug message without metadata';

      service.logProviderDebug(providerId, message);

      expect(service.logger.debug).toHaveBeenCalledWith(
        `Provider ${providerId}: ${message}`,
        undefined,
      );
    });

    it('should log provider debug with metadata', () => {
      const providerId = 'testProvider';
      const message = 'Debug with metadata';
      const metadata = { requestId: '12345', chainId: 1 };

      service.logProviderDebug(providerId, message, metadata);

      expect(service.logger.debug).toHaveBeenCalledWith(
        `Provider ${providerId}: ${message}`,
        metadata,
      );
    });
  });

  describe('logDebug', () => {
    it('should log general debug message', () => {
      const message = 'General debug message';

      service.logDebug(message);

      expect(service.logger.debug).toHaveBeenCalledWith(message, undefined);
    });

    it('should log general debug message with metadata', () => {
      const message = 'Debug with metadata';
      const metadata = { userId: 'user123', action: 'swap' };

      service.logDebug(message, metadata);

      expect(service.logger.debug).toHaveBeenCalledWith(message, metadata);
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have a logger instance', () => {
      expect(service.logger).toBeDefined();
      expect(service.logger.error).toBeDefined();
      expect(service.logger.log).toBeDefined();
      expect(service.logger.debug).toBeDefined();
    });
  });
});

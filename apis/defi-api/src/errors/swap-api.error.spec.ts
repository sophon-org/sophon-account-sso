import { ErrorCodes, SwapAPIError } from './swap-api.error';

describe('SwapAPIError', () => {
  describe('constructor', () => {
    it('should create error with required parameters', () => {
      const error = new SwapAPIError('Test error', ErrorCodes.PROVIDER_ERROR);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.PROVIDER_ERROR);
      expect(error.name).toBe('SwapAPIError');
      expect(error.provider).toBeUndefined();
      expect(error.originalError).toBeUndefined();
      expect(error.statusCode).toBe(400);
    });

    it('should create error with all parameters', () => {
      const originalError = new Error('Original error');
      const error = new SwapAPIError(
        'Test error',
        ErrorCodes.NETWORK_ERROR,
        'test-provider',
        originalError,
        500,
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.NETWORK_ERROR);
      expect(error.name).toBe('SwapAPIError');
      expect(error.provider).toBe('test-provider');
      expect(error.originalError).toBe(originalError);
      expect(error.statusCode).toBe(500);
    });

    it('should be instance of Error', () => {
      const error = new SwapAPIError('Test error', ErrorCodes.VALIDATION_ERROR);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof SwapAPIError).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON format', () => {
      const error = new SwapAPIError(
        'Test error message',
        ErrorCodes.PROVIDER_ERROR,
        'test-provider',
        new Error('original'),
        404,
      );

      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          message: 'Test error message',
          code: ErrorCodes.PROVIDER_ERROR,
          provider: 'test-provider',
          statusCode: 404,
        },
      });
    });

    it('should serialize error with minimal parameters', () => {
      const error = new SwapAPIError('Simple error', ErrorCodes.API_KEY_ERROR);

      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          message: 'Simple error',
          code: ErrorCodes.API_KEY_ERROR,
          provider: undefined,
          statusCode: 400,
        },
      });
    });

    it('should work with JSON.stringify', () => {
      const error = new SwapAPIError(
        'Stringify test',
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'api-provider',
      );

      const jsonString = JSON.stringify(error);
      const parsed = JSON.parse(jsonString);

      expect(parsed.error.message).toBe('Stringify test');
      expect(parsed.error.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(parsed.error.provider).toBe('api-provider');
      expect(parsed.error.statusCode).toBe(400);
    });
  });

  describe('ErrorCodes enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.INVALID_PARAMETERS).toBe('INVALID_PARAMETERS');
      expect(ErrorCodes.PROVIDER_ERROR).toBe('PROVIDER_ERROR');
      expect(ErrorCodes.PROVIDER_NOT_FOUND).toBe('PROVIDER_NOT_FOUND');
      expect(ErrorCodes.PROVIDER_DISABLED).toBe('PROVIDER_DISABLED');
      expect(ErrorCodes.INSUFFICIENT_LIQUIDITY).toBe('INSUFFICIENT_LIQUIDITY');
      expect(ErrorCodes.UNSUPPORTED_ROUTE).toBe('UNSUPPORTED_ROUTE');
      expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCodes.TRANSACTION_NOT_FOUND).toBe('TRANSACTION_NOT_FOUND');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCodes.API_KEY_ERROR).toBe('API_KEY_ERROR');
    });
  });
});

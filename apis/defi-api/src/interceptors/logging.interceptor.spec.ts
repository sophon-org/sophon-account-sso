import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: Partial<Logger>;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    interceptor = new LoggingInterceptor();
    Object.defineProperty(interceptor, 'logger', {
      value: mockLogger,
      writable: true,
    });

    mockExecutionContext = {
      switchToHttp: jest.fn(),
    };

    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should log successful request completion', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/test',
        body: { data: 'test' },
        query: { param: 'value' },
      };

      const mockResponse = { result: 'success' };

      (mockExecutionContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: () => mockRequest,
      });

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(mockResponse));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (response) => {
          expect(response).toBe(mockResponse);
          expect(mockLogger.log).toHaveBeenCalledTimes(2);

          expect(mockLogger.log).toHaveBeenNthCalledWith(
            1,
            'Incoming request: GET /test',
            {
              requestId: expect.any(String),
              body: { data: 'test' },
              query: { param: 'value' },
            },
          );

          expect(mockLogger.log).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/Request completed: GET \/test \(\d+ms\)/),
            {
              requestId: expect.any(String),
              duration: expect.any(Number),
              responseSize: expect.any(Number),
            },
          );

          done();
        },
      });
    });

    it('should log and rethrow errors', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/error',
        body: null,
        query: {},
      };

      const mockError = new Error('Test error');
      mockError.stack = 'Error stack trace';

      (mockExecutionContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: () => mockRequest,
      });

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => mockError),
      );

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          expect(mockLogger.log).toHaveBeenCalledWith(
            'Incoming request: POST /error',
            {
              requestId: expect.any(String),
              body: null,
              query: {},
            },
          );

          expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringMatching(/Request failed: POST \/error \(\d+ms\)/),
            {
              requestId: expect.any(String),
              duration: expect.any(Number),
              error: 'Test error',
              stack: 'Error stack trace',
            },
          );

          done();
        },
      });
    });

    it('should generate unique request IDs for concurrent requests', () => {
      const mockRequest = {
        method: 'GET',
        url: '/test',
        body: {},
        query: {},
      };

      (mockExecutionContext.switchToHttp as jest.Mock).mockReturnValue({
        getRequest: () => mockRequest,
      });

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ success: true }),
      );

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockLogger.log).toHaveBeenCalledTimes(4);
      const firstRequestId = (mockLogger.log as jest.Mock).mock.calls[0][1]
        .requestId;
      const secondRequestId = (mockLogger.log as jest.Mock).mock.calls[2][1]
        .requestId;

      expect(firstRequestId).not.toBe(secondRequestId);
    });
  });

  describe('sanitizeBody', () => {
    it('should redact sensitive fields from body', () => {
      const interceptorInstance = new LoggingInterceptor();
      const sensitiveBody = {
        data: 'normal data',
        apiKey: 'secret-key',
        password: 'secret-password',
        privateKey: 'private-key-value',
        secret: 'secret-value',
        normalField: 'normal value',
      };

      const result = interceptorInstance.sanitizeBody(sensitiveBody);

      expect(result).toEqual({
        data: 'normal data',
        apiKey: '***REDACTED***',
        password: '***REDACTED***',
        privateKey: '***REDACTED***',
        secret: '***REDACTED***',
        normalField: 'normal value',
      });
    });

    it('should return original body if no sensitive fields present', () => {
      const interceptorInstance = new LoggingInterceptor();
      const normalBody = {
        data: 'normal data',
        user: 'john',
        action: 'create',
      };

      const result = interceptorInstance.sanitizeBody(normalBody);

      expect(result).toEqual(normalBody);
      expect(result).not.toBe(normalBody); // Should be a copy
    });

    it('should handle null or undefined body', () => {
      const interceptorInstance = new LoggingInterceptor();

      expect(interceptorInstance.sanitizeBody(null)).toBe(null);
      expect(interceptorInstance.sanitizeBody(undefined)).toBe(undefined);
    });

    it('should handle body without sensitive fields', () => {
      const interceptorInstance = new LoggingInterceptor();
      const body = { name: 'test', value: 123 };

      const result = interceptorInstance.sanitizeBody(body);

      expect(result).toEqual(body);
      expect(result).not.toBe(body);
    });
  });
});

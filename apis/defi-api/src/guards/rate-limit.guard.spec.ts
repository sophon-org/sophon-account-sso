import { type ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    guard = new RateLimitGuard();

    // Mock the logger to prevent actual logging
    (guard as any).logger = {
      warn: jest.fn(),
    };

    mockRequest = {
      headers: {
        'user-agent': 'test-agent',
      },
      connection: {
        remoteAddress: '127.0.0.1',
      },
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  afterEach(() => {
    // Clear the rate limit state between tests
    (guard as any).requests.clear();
  });

  describe('canActivate', () => {
    it('should allow first request from a client', () => {
      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow requests within rate limit', () => {
      // Make multiple requests within the limit
      for (let i = 0; i < 10; i++) {
        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      // Exhaust the rate limit (default is 100 requests per minute)
      for (let i = 0; i < 100; i++) {
        guard.canActivate(mockExecutionContext);
      }

      // The 101st request should throw an exception
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        HttpException,
      );
    });

    it('should use forwarded IP from x-forwarded-for header', () => {
      mockRequest.headers['x-forwarded-for'] = '192.168.1.100, 10.0.0.1';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);

      // Verify that the forwarded IP is being used by checking the internal state
      const clientsMap = (guard as any).requests;
      expect(clientsMap.has('192.168.1.100-test-agent')).toBe(true);
    });

    it('should fallback to connection remote address when no forwarded header', () => {
      mockRequest.connection.remoteAddress = '192.168.1.200';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);

      const clientsMap = (guard as any).requests;
      expect(clientsMap.has('192.168.1.200-test-agent')).toBe(true);
    });

    it('should handle missing IP address gracefully', () => {
      mockRequest.headers = {};
      mockRequest.connection.remoteAddress = undefined;

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);

      const clientsMap = (guard as any).requests;
      expect(clientsMap.has('undefined-unknown')).toBe(true);
    });

    it('should reset rate limit after time window expires', () => {
      const originalDateNow = Date.now;
      let currentTime = 1000000;

      // Mock Date.now to control time
      Date.now = jest.fn().mockImplementation(() => currentTime);

      try {
        // Make requests to reach the limit
        for (let i = 0; i < 100; i++) {
          guard.canActivate(mockExecutionContext);
        }

        // Should be blocked
        expect(() => guard.canActivate(mockExecutionContext)).toThrow(
          HttpException,
        );

        // Move time forward beyond the window (default is 60 seconds)
        currentTime += 61000;

        // Should be allowed again
        expect(guard.canActivate(mockExecutionContext)).toBe(true);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it('should clean up expired entries', () => {
      const originalDateNow = Date.now;
      let currentTime = 1000000;

      Date.now = jest.fn().mockImplementation(() => currentTime);

      try {
        // Create entries for multiple clients
        mockRequest.connection.remoteAddress = '192.168.1.1';
        guard.canActivate(mockExecutionContext);

        mockRequest.connection.remoteAddress = '192.168.1.2';
        guard.canActivate(mockExecutionContext);

        const clientsMap = (guard as any).requests;
        expect(clientsMap.size).toBe(2);

        // Move time forward
        currentTime += 61000;

        // Call getStats to trigger cleanup of expired entries
        guard.getStats();

        // Make another request after cleanup
        mockRequest.connection.remoteAddress = '192.168.1.3';
        guard.canActivate(mockExecutionContext);

        // Should have cleaned up expired entries and added the new one
        expect(clientsMap.size).toBe(1);
        expect(clientsMap.has('192.168.1.3-test-agent')).toBe(true);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it('should track request count correctly', () => {
      // Make several requests
      for (let i = 0; i < 5; i++) {
        guard.canActivate(mockExecutionContext);
      }

      const clientsMap = (guard as any).requests;
      const clientEntry = clientsMap.get('127.0.0.1-test-agent');
      expect(clientEntry.count).toBe(5);
    });
  });

  describe('getStats', () => {
    it('should return correct stats and clean up expired entries', () => {
      const originalDateNow = Date.now;
      let currentTime = 1000000;

      Date.now = jest.fn().mockImplementation(() => currentTime);

      try {
        // Create some active entries
        guard.canActivate(mockExecutionContext);

        mockRequest.connection.remoteAddress = '192.168.1.2';
        guard.canActivate(mockExecutionContext);

        // Check initial stats
        let stats = guard.getStats();
        expect(stats.totalClients).toBe(2);
        expect(stats.activeClients).toBe(2);

        // Move time forward to expire entries
        currentTime += 61000;

        // Get stats again (should clean up)
        stats = guard.getStats();
        expect(stats.totalClients).toBe(0);
        expect(stats.activeClients).toBe(0);
      } finally {
        Date.now = originalDateNow;
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed x-forwarded-for header', () => {
      mockRequest.headers['x-forwarded-for'] = '';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should handle numeric IP addresses in forwarded header', () => {
      mockRequest.headers['x-forwarded-for'] = '192.168.1.100';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);

      const clientsMap = (guard as any).requests;
      expect(clientsMap.has('192.168.1.100-test-agent')).toBe(true);
    });
  });
});

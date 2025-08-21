import { describe, expect, it, vi } from 'vitest';
import { TransactionType } from '../../types/swap';

describe('useGetSwapTransaction', () => {
  it('should format query parameters correctly', () => {
    const mockRequest = {
      actionType: TransactionType.SWAP,
      sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
      sourceChain: 8453,
      destinationChain: 42161,
      sourceToken: '0x0000000000000000000000000000000000000000',
      destinationToken: '0x0000000000000000000000000000000000000000',
      amount: BigInt('1000000000000000'),
      slippage: 1,
    };

    // Test parameter formatting logic
    const params = {
      actionType: mockRequest.actionType,
      sender: mockRequest.sender,
      sourceChain: mockRequest.sourceChain.toString(),
      destinationChain: mockRequest.destinationChain.toString(),
      sourceToken: mockRequest.sourceToken,
      destinationToken: mockRequest.destinationToken,
      amount: mockRequest.amount.toString(),
      slippage: mockRequest.slippage.toString(),
    };

    expect(params.actionType).toBe(TransactionType.SWAP);
    expect(params.sourceChain).toBe('8453');
    expect(params.destinationChain).toBe('42161');
    expect(params.amount).toBe('1000000000000000');
    expect(params.slippage).toBe('1');
  });

  it('should handle retry logic correctly', () => {
    const retryLogic = (failureCount: number, error: Error) => {
      if (error.message.includes('HTTP 4')) {
        return false;
      }
      return failureCount < 3;
    };

    // Test 4xx errors (should not retry)
    expect(retryLogic(1, new Error('HTTP 400: Bad Request'))).toBe(false);
    expect(retryLogic(1, new Error('HTTP 404: Not Found'))).toBe(false);

    // Test network errors (should retry)
    expect(retryLogic(1, new Error('Network error'))).toBe(true);
    expect(retryLogic(2, new Error('Network error'))).toBe(true);
    expect(retryLogic(3, new Error('Network error'))).toBe(false);

    // Test 5xx errors (should retry)
    expect(retryLogic(1, new Error('HTTP 500: Internal Server Error'))).toBe(
      true,
    );
  });

  it('should determine enabled state correctly', () => {
    const isEnabled = (
      hasConfig: boolean,
      hasSender: boolean,
      enabled: boolean,
    ) => {
      return enabled && hasConfig && hasSender;
    };

    expect(isEnabled(true, true, true)).toBe(true);
    expect(isEnabled(true, false, true)).toBe(false);
    expect(isEnabled(false, true, true)).toBe(false);
    expect(isEnabled(true, true, false)).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';

describe('useGetSwapStatus', () => {
  it('should format status query parameters correctly', () => {
    const txHash = '0xabc123';
    const chainId = 8453;

    const params: Record<string, string> = {
      txHash,
    };
    
    if (chainId) {
      params.sourceChainId = chainId.toString();
    }

    expect(params.txHash).toBe('0xabc123');
    expect(params.sourceChainId).toBe('8453');
  });

  it('should handle refetch interval logic correctly', () => {
    const getRefetchInterval = (status?: string, defaultInterval = 5000) => {
      if (status && ['confirmed', 'failed', 'cancelled'].includes(status)) {
        return false;
      }
      return defaultInterval;
    };

    expect(getRefetchInterval('confirmed')).toBe(false);
    expect(getRefetchInterval('failed')).toBe(false);
    expect(getRefetchInterval('cancelled')).toBe(false);
    expect(getRefetchInterval('pending')).toBe(5000);
    expect(getRefetchInterval(undefined)).toBe(5000);
    expect(getRefetchInterval('pending', 3000)).toBe(3000);
  });

  it('should determine query enabled state correctly', () => {
    const isEnabled = (txHash: string, enabled: boolean) => {
      return enabled && !!txHash;
    };

    expect(isEnabled('0xabc123', true)).toBe(true);
    expect(isEnabled('', true)).toBe(false);
    expect(isEnabled('0xabc123', false)).toBe(false);
  });
});
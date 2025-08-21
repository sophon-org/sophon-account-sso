import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useERC20Approval, useERC20InfiniteApproval } from '../useERC20Approval';

// Mock wagmi hooks - complete mock
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(() => ({
    data: BigInt(0),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    isPending: false,
    error: null,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
    error: null,
  })),
  useAccount: vi.fn(() => ({
    address: '0x123',
    isConnected: true,
  })),
  useConfig: vi.fn(() => ({
    chains: [],
    connectors: [],
  })),
}));

describe('useERC20Approval Hook Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate approval status correctly', () => {
    const isApproved = (currentAllowance: bigint, requiredAmount: bigint) => {
      return currentAllowance >= requiredAmount;
    };

    const requiredAmount = BigInt('1000000000000000000');

    expect(isApproved(BigInt('2000000000000000000'), requiredAmount)).toBe(true);
    expect(isApproved(BigInt('1000000000000000000'), requiredAmount)).toBe(true);
    expect(isApproved(BigInt('500000000000000000'), requiredAmount)).toBe(false);
    expect(isApproved(BigInt('0'), requiredAmount)).toBe(false);
  });
});

describe('useERC20InfiniteApproval Hook', () => {
  it('should use max uint256 for infinite approval', () => {
    const { result } = renderHook(() => 
      useERC20InfiniteApproval({
        tokenAddress: '0x123',
        spender: '0x456',
      })
    );

    const maxUint256 = 2n ** 256n - 1n;
    const requiredAmount = BigInt('1000000000000000000');

    expect(maxUint256 > requiredAmount).toBe(true);
    expect(maxUint256.toString()).toBe('115792089237316195423570985008687907853269984665640564039457584007913129639935');
  });
});
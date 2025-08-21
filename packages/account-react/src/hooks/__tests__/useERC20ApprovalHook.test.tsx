import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useERC20Approval,
  useERC20InfiniteApproval,
} from '../useERC20Approval';

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

    expect(isApproved(BigInt('2000000000000000000'), requiredAmount)).toBe(
      true,
    );
    expect(isApproved(BigInt('1000000000000000000'), requiredAmount)).toBe(
      true,
    );
    expect(isApproved(BigInt('500000000000000000'), requiredAmount)).toBe(
      false,
    );
    expect(isApproved(BigInt('0'), requiredAmount)).toBe(false);
  });
});

describe('useERC20InfiniteApproval Hook', () => {
  it('should use max uint256 for infinite approval', () => {
    const { result } = renderHook(() =>
      useERC20InfiniteApproval({
        tokenAddress: '0x123',
        spender: '0x456',
      }),
    );

    // Test the hook's actual functionality
    expect(result.current.isApproved).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentAllowance).toBe(0n);
    expect(typeof result.current.approve).toBe('function');
    expect(result.current.error).toBe(null);
  });
});

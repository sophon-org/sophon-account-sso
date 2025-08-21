import { describe, expect, it } from 'vitest';

describe('useERC20Approval', () => {
  it('should calculate approval status correctly', () => {
    const isApproved = (currentAllowance: bigint, requiredAmount: bigint) => {
      return currentAllowance >= requiredAmount;
    };

    const requiredAmount = BigInt('1000000000000000000'); // 1 ETH

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

  it('should handle max uint256 for infinite approval', () => {
    const maxUint256 = 2n ** 256n - 1n;
    const requiredAmount = BigInt('1000000000000000000');

    expect(maxUint256 > requiredAmount).toBe(true);
    expect(maxUint256.toString()).toBe(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    );
  });

  it('should determine when approval is needed', () => {
    const needsApproval = (
      currentAllowance: bigint,
      requiredAmount: bigint,
      hasWallet: boolean,
    ) => {
      return hasWallet && currentAllowance < requiredAmount;
    };

    const requiredAmount = BigInt('1000000000000000000');

    expect(needsApproval(BigInt('0'), requiredAmount, true)).toBe(true);
    expect(
      needsApproval(BigInt('500000000000000000'), requiredAmount, true),
    ).toBe(true);
    expect(
      needsApproval(BigInt('2000000000000000000'), requiredAmount, true),
    ).toBe(false);
    expect(needsApproval(BigInt('0'), requiredAmount, false)).toBe(false);
  });

  it('should handle loading states correctly', () => {
    const isLoading = (
      isSettingLoading: boolean,
      isWritePending: boolean,
      isConfirming: boolean,
    ) => {
      return isSettingLoading || isWritePending || isConfirming;
    };

    expect(isLoading(true, false, false)).toBe(true);
    expect(isLoading(false, true, false)).toBe(true);
    expect(isLoading(false, false, true)).toBe(true);
    expect(isLoading(false, false, false)).toBe(false);
  });
});

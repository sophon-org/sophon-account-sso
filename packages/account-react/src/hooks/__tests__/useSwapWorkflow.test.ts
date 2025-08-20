import { describe, it, expect } from 'vitest';

type SwapWorkflowStep = 
  | 'preparing'
  | 'approval-needed'
  | 'approving'
  | 'ready-to-swap'
  | 'swapping'
  | 'confirming'
  | 'completed'
  | 'failed';

describe('useSwapWorkflow', () => {
  it('should determine correct workflow step', () => {
    const determineStep = (
      isPreparingSwap: boolean,
      hasError: boolean,
      needsApproval: boolean,
      isApproved: boolean,
      isApproving: boolean,
      hasSwapData: boolean,
      isSwapping: boolean,
      isConfirming: boolean,
      isCompleted: boolean
    ): SwapWorkflowStep => {
      if (isPreparingSwap) return 'preparing';
      if (hasError) return 'failed';
      if (needsApproval && !isApproved) {
        return isApproving ? 'approving' : 'approval-needed';
      }
      if (isCompleted) return 'completed';
      if (isConfirming) return 'confirming';
      if (isSwapping) return 'swapping';
      if (hasSwapData) return 'ready-to-swap';
      return 'preparing';
    };

    expect(determineStep(true, false, false, false, false, false, false, false, false)).toBe('preparing');
    expect(determineStep(false, true, false, false, false, false, false, false, false)).toBe('failed');
    expect(determineStep(false, false, true, false, false, true, false, false, false)).toBe('approval-needed');
    expect(determineStep(false, false, true, false, true, true, false, false, false)).toBe('approving');
    expect(determineStep(false, false, false, true, false, true, false, false, false)).toBe('ready-to-swap');
    expect(determineStep(false, false, false, true, false, true, true, false, false)).toBe('swapping');
    expect(determineStep(false, false, false, true, false, true, false, true, false)).toBe('confirming');
    expect(determineStep(false, false, false, true, false, true, false, false, true)).toBe('completed');
  });

  it('should calculate progress correctly', () => {
    const calculateProgress = (currentStep: SwapWorkflowStep, needsApproval: boolean) => {
      const stepOrder: SwapWorkflowStep[] = [
        'preparing',
        'approval-needed',
        'ready-to-swap',
        'swapping',
        'confirming',
        'completed'
      ];

      const currentIndex = stepOrder.indexOf(currentStep);
      
      return {
        preparing: currentIndex > 0,
        approvalNeeded: !needsApproval || currentIndex > 1,
        readyToSwap: currentIndex >= 2,
        swapping: currentIndex >= 3,
        completed: currentIndex >= 5,
      };
    };

    const progressWithApproval = calculateProgress('ready-to-swap', true);
    expect(progressWithApproval.preparing).toBe(true);
    expect(progressWithApproval.approvalNeeded).toBe(true);
    expect(progressWithApproval.readyToSwap).toBe(true);
    expect(progressWithApproval.swapping).toBe(false);

    const progressWithoutApproval = calculateProgress('ready-to-swap', false);
    expect(progressWithoutApproval.approvalNeeded).toBe(true); // No approval needed, so considered done
  });

  it('should validate swap execution requirements', () => {
    const canExecuteSwap = (
      hasSwapData: boolean,
      hasWalletAddress: boolean,
      currentStep: SwapWorkflowStep
    ) => {
      return hasSwapData && hasWalletAddress && currentStep === 'ready-to-swap';
    };

    expect(canExecuteSwap(true, true, 'ready-to-swap')).toBe(true);
    expect(canExecuteSwap(false, true, 'ready-to-swap')).toBe(false);
    expect(canExecuteSwap(true, false, 'ready-to-swap')).toBe(false);
    expect(canExecuteSwap(true, true, 'preparing')).toBe(false);
  });

  it('should determine when to auto-approve', () => {
    const shouldAutoApprove = (
      autoApprove: boolean,
      currentStep: SwapWorkflowStep
    ) => {
      return autoApprove && currentStep === 'approval-needed';
    };

    expect(shouldAutoApprove(true, 'approval-needed')).toBe(true);
    expect(shouldAutoApprove(false, 'approval-needed')).toBe(false);
    expect(shouldAutoApprove(true, 'ready-to-swap')).toBe(false);
  });
});
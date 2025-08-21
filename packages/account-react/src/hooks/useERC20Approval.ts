import { useCallback, useState } from 'react';
import { erc20Abi, maxUint256 } from 'viem';
import { sophonTestnet } from 'viem/chains';
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import type { UseERC20ApprovalArgs } from '../types/swap';

// Explicit ERC20 approve ABI to avoid MetaMask confusion
const ERC20_APPROVE_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Hook to handle ERC20 token approvals
 * Provides approval status checking and approval transaction execution
 */
export function useERC20Approval(args: UseERC20ApprovalArgs) {
  const { tokenAddress, spender, amount, chainId } = args;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get user address (use context automatically)
  const { address: userAddress } = useAccount();

  // Read current allowance (use context automatically)
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: userAddress
        ? [userAddress as `0x${string}`, spender as `0x${string}`]
        : undefined,
      chainId,
      query: {
        enabled: !!userAddress && !!tokenAddress && !!spender,
      },
    } as const,
  );

  // Write contract for approval (use context automatically)
  const {
    writeContract,
    data: approvalTxHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  // Wait for approval transaction (use context automatically)
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
    chainId,
  });

  // Check if current allowance is sufficient
  const isApproved = currentAllowance
    ? (currentAllowance as bigint) >= amount
    : false;

  // Approve function
  const approve = useCallback(async () => {
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Write approval transaction with explicit ABI
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amount],
        // TODO: review this
        chain: sophonTestnet,
        account: userAddress as `0x${string}`,
      } as const);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Approval failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, tokenAddress, spender, amount, writeContract]);

  // Refresh allowance after successful approval
  if (isConfirmed) {
    refetchAllowance();
  }

  return {
    isApproved,
    approve,
    isLoading: isLoading || isWritePending || isConfirming,
    error: error || writeError || confirmError,
    currentAllowance: currentAllowance || 0n,
    approvalTxHash,
    isConfirmed,
    refetchAllowance,
  };
}

/**
 * Helper hook for infinite approval (max uint256)
 */
export function useERC20InfiniteApproval(
  args: Omit<UseERC20ApprovalArgs, 'amount'>,
) {
  const maxAmount = maxUint256;

  return useERC20Approval({
    ...args,
    amount: maxAmount,
  });
}

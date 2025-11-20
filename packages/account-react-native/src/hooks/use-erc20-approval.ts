import { useCallback, useEffect, useState } from 'react';
import { createPublicClient, erc20Abi, http, maxUint256 } from 'viem';
import type { UseERC20ApprovalArgs } from '../types';
import { useSophonContext } from './use-sophon-context';

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
 *
 * Provides approval status checking and approval transaction execution
 */
export function useERC20Approval(args: UseERC20ApprovalArgs) {
  const { tokenAddress, spender, amount } = args;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentAllowance, setCurrentAllowance] = useState<bigint>(0n);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | null>(
    null,
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const { chain, walletClient, account } = useSophonContext();

  // Create a public client for reading contract data
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  // Function to read current allowance
  const refetchAllowance = useCallback(async () => {
    if (!account?.address || !tokenAddress || !spender) {
      setCurrentAllowance(0n);
      return;
    }

    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account.address, spender as `0x${string}`],
        authorizationList: undefined,
      });

      setCurrentAllowance(allowance as bigint);
    } catch (err) {
      console.error('Failed to read allowance:', err);
      setCurrentAllowance(0n);
    }
  }, [account?.address, tokenAddress, spender, publicClient]);

  // Load allowance on mount and when dependencies change
  useEffect(() => {
    refetchAllowance();
  }, [refetchAllowance]);

  // Check if current allowance is sufficient
  const isApproved = currentAllowance >= amount;

  // Approve function
  const approve = useCallback(async () => {
    if (!account?.address) {
      throw new Error('Wallet not connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsConfirmed(false);
      setIsConfirming(false);

      // Write approval transaction
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amount],
        account: account.address,
        chain,
      });

      setApprovalTxHash(hash);
      setIsConfirming(true);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      if (receipt.status === 'success') {
        setIsConfirmed(true);
        // Refresh allowance after successful approval
        await refetchAllowance();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Approval failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
    }
  }, [
    account?.address,
    walletClient,
    tokenAddress,
    spender,
    amount,
    chain,
    publicClient,
    refetchAllowance,
  ]);

  return {
    isApproved,
    approve,
    isLoading: isLoading || isConfirming,
    isError: !!error,
    error,
    currentAllowance,
    approvalTxHash,
    isConfirmed,
    refetch: refetchAllowance,
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

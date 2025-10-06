export interface CustomRPCError extends Error {
  details?: string;
  code: number;
}

export interface SophonJWTToken {
  value: string;
  expiresAt: number;
}

/**
 * Type definitions for swap functionality
 */

export type Address = string;
export type ChainId = number;

export enum TransactionType {
  SWAP = 'swap',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface TokenApproval {
  token: Address;
  spender: Address;
  amount: string;
}

export interface FeeBreakdown {
  gas: string;
  protocol: string;
  bridge?: string;
  total: string;
}

export interface TransactionDetails {
  hash: string;
  sourceChain: ChainId;
  destinationChain: ChainId;
  sourceToken: Address;
  destinationToken: Address;
  amount: string;
  recipient: Address;
}

export interface TransactionTimestamps {
  initiated: Date;
  confirmed?: Date;
  completed?: Date;
}

export interface TransactionOptions {
  paymaster?: Address;
  paymasterInput?: string;
  deadline?: number;
  gasLimit?: string;
}

export interface ActionConfiguration {
  [key: string]: unknown;
}

export interface UnifiedTransactionRequest {
  actionType: TransactionType;
  sender: Address;
  sourceChain: ChainId;
  destinationChain: ChainId;
  sourceToken: Address;
  destinationToken: Address;
  amount: bigint;
  slippage: number;
  recipient?: Address;
  actionConfig?: ActionConfiguration;
  options?: TransactionOptions;
}

export interface UnifiedTransactionResponse {
  transactionId: string;
  provider: string;
  transaction: {
    to: Address;
    data: string;
    value: string;
    chainId: ChainId;
  };
  fees: FeeBreakdown;
  estimatedTime: number;
  exchangeRate?: number;
  requiredApprovals?: TokenApproval[];
}

export interface UnifiedStatusResponse {
  found: boolean;
  status: TransactionStatus;
  provider: string;
  transaction: TransactionDetails;
  fees: FeeBreakdown;
  timestamps: TransactionTimestamps;
  links: {
    explorer: string;
    providerTracker?: string;
  };
}

export interface UseGetSwapTransactionArgs {
  config: UnifiedTransactionRequest;
  enabled?: boolean;
}

export interface UseGetSwapStatusArgs {
  txHash: string;
  chainId?: ChainId;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseERC20ApprovalArgs {
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
  chainId?: ChainId;
}

export interface UseGasEstimationArgs {
  to?: Address;
  from?: Address;
  data?: string;
  value?: bigint;
  chainId: ChainId;
}

export interface SwapApiConfig {
  baseUrl: string;
  timeout?: number;
}

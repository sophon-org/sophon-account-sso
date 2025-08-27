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

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
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

export interface FeeEstimate {
  estimatedGas: string;
  gasPrice: string;
  totalFeeUsd?: number;
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
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}


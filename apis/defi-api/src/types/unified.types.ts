import {
  ActionConfiguration,
  Address,
  ChainId,
  FeeBreakdown,
  TokenApproval,
  TransactionDetails,
  TransactionOptions,
  TransactionStatus,
  TransactionTimestamps,
  TransactionType,
} from './common.types';

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

export interface UnifiedStatusRequest {
  transactionHash: string;
  sourceChainId?: ChainId;
  provider?: string;
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

export interface GetProvidersResponse {
  providers: {
    providerId: string;
    name: string;
    enabled: boolean;
    supportedChains: ChainId[];
  }[];
}

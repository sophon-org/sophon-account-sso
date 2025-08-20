import { Address, ChainId } from './common.types';

export interface SwapActionRequest {
  actionType: 'swap-action' | 'evm-calldata-tx' | 'evm-function';
  sender: Address;
  srcToken: Address;
  srcChainId: ChainId;
  dstToken: Address;
  dstChainId: ChainId;
  slippage: number; // in bps
  actionConfig?: SwapActionConfig | EvmCalldataTxConfig | EvmFunctionConfig;
  bridgeIds?: string[];
  refundTo?: Address;
  paymaster?: Address;
  paymasterInput?: string;
}

export interface SwapActionConfig {
  swapDirection: 'exact-amount-in' | 'exact-amount-out';
  amount: bigint;
  receiverAddress: Address;
}

export interface EvmCalldataTxConfig {
  contractAddress: Address;
  chainId: ChainId;
  cost: {
    amount: bigint;
    address: Address;
  };
  data: string;
  value?: bigint;
}

export interface EvmFunctionConfig {
  contractAddress: Address;
  chainId: ChainId;
  cost: {
    amount: bigint;
    address: Address;
  };
  signature: string;
  args: any[];
}

export interface SwapActionResponse {
  tx: {
    to: Address;
    data: string;
    value: string;
    gasPrice?: string;
    gasLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    chainId: ChainId;
  };
  txId: string;
  VmId: 'evm' | 'solana' | 'alt-vm';
  amountIn: TokenAmount;
  amountInMax: TokenAmount;
  amountOut: TokenAmount;
  amountOutMin: TokenAmount;
  protocolFee: TokenAmount;
  applicationFee: TokenAmount;
  bridgeFee?: TokenAmount;
  bridgeIds?: string[];
  bridgeRoute?: BridgeRoute[];
  exchangeRate: number;
  estimatedTxTime: number;
  estimatedPriceImpact: number;
  allRoutes?: SwapActionResponse[];
}

export interface TokenAmount {
  tokenAddress: Address;
  decimals: number;
  symbol: string;
  name: string;
  chainId: ChainId;
  amount: string;
}

export interface BridgeRoute {
  srcChainId: ChainId;
  dstChainId: ChainId;
  srcBridgeToken: Address;
  dstBridgeToken: Address;
  bridgeId: string;
}

export interface SwapStatusRequest {
  txHash?: string;
  txId?: string;
  chainId?: ChainId;
}

export interface SwapStatusResponse {
  tx: {
    txId: string;
    status: 'success' | 'pending' | 'refunded' | 'failed';
    sender: Address;
    srcChainId: ChainId;
    dstChainId: ChainId;
    srcTxHash: string;
    dstTxHash?: string;
    bridgeDetails: {
      isBridge: boolean;
      bridgeTime?: number;
      txPath: Array<{
        chainId: ChainId;
        txHash: string;
        timestamp: string;
        nextBridge?: string;
      }>;
    };
    org?: {
      appId: string;
      affiliateId?: string;
      appFees?: Array<{
        recipient: Address;
        token: Address;
        amount: string;
      }>;
    };
    usdValue?: number;
    srcTx?: TxDetails;
    dstTx?: TxDetails;
  };
}

export interface TxDetails {
  toAddress: Address;
  txHash: string;
  chainId: ChainId;
  blockExplorer: string;
  gasProvided?: string;
  gasUsed?: string;
  value?: string;
  timestamp?: string;
  blockNumber?: number;
  input?: string;
  revertReason?: string;
  paymentToken?: {
    name: string;
    symbol: string;
    decimals: number;
    amount: string;
    address: Address;
  };
}
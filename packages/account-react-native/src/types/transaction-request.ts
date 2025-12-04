import type { Address } from 'viem';

export interface TransactionCurrentRequest {
  from: Address;
  to: Address;
  data?: `0x${string}`;
  value?: string;
  paymaster?: string;
  paymasterInput?: string;
}

interface ActionCurrentRequest {
  method: string;
  params: TransactionCurrentRequest[];
}

export interface ContentCurrentRequest {
  action: ActionCurrentRequest;
}

export type TokenInfo = {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  tokenDecimal: string;
  tokenPriceUSD: string;
  liquidity: string;
  l1Address: string;
  iconURL: string;
};

export interface AddressSourceCode {
  ABI: string;
  CompilerVersion: string;
  ConstructorArguments: string;
  ContractName: string;
  EVMVersion: string;
  Implementation: string;
  Library: string;
  LicenseType: string;
  OptimizationUsed: string;
  Proxy: string;
  Runs: string;
  SourceCode: string;
  SwarmSource: string;
  VerifiedAt: string;
  Match: string;
}

export enum TransactionType {
  SOPH = 'soph',
  ERC20 = 'erc20',
  CONTRACT = 'contract',
  APPROVE = 'approve',
  UNKNOWN = 'unknown',
}

export enum ERC20FunctionName {
  TRANSFER = 'transfer',
  APPROVE = 'approve',
  TRANSFER_FROM = 'transferFrom',
  ALLOWANCE = 'allowance',
}

export interface BaseEnrichedTransaction extends TransactionCurrentRequest {
  transactionType: TransactionType;
  token?: TokenInfo;
  recipient: Address;
  displayValue: string;
  fee?: {
    SOPH: string;
    USD?: string;
  };
}

export interface EnrichedSOPHTransaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.SOPH;
  token: TokenInfo;
}

export interface EnrichedERC20Transaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.ERC20;
  token: TokenInfo;
}

export interface EnrichedApprovalTransaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.APPROVE;
  token: TokenInfo & { currentBalance: string };
  spender: {
    name: string;
    address: string;
    spendingCap: string;
  };
}

export interface DecodedArgsContractTransaction {
  type: string;
  name: string;
  value: string | `0x${string}`;
}

export type DecodedTransactionData = {
  args: DecodedArgsContractTransaction[];
  functionName: string;
};

export interface EnrichedContractTransaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.CONTRACT;
  decodedData?: DecodedTransactionData;
  contractName?: string;
  isVerified: boolean;
}

export interface EnrichedUnknownTransaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.UNKNOWN;
}

export type EnrichedTransactionRequest =
  | EnrichedSOPHTransaction
  | EnrichedERC20Transaction
  | EnrichedApprovalTransaction
  | EnrichedContractTransaction
  | EnrichedUnknownTransaction;

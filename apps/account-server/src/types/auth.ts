import type { Address, Hash, TypedDataParameter } from 'viem';
import type { SmartAccount } from './smart-account';

export type TypedDataDomain = {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: Address;
  salt?: Hash;
};

export interface IncomingRequest {
  id: string;
  content: unknown;
}

export interface MessageSigningRequest {
  message: string;
  address: string;
}

export interface TypedDataSigningRequest {
  domain: TypedDataDomain;
  types: Record<string, readonly TypedDataParameter[]>;
  primaryType: string;
  message: Record<string, unknown>;
  address: string;
}

export interface AuthenticationRequest {
  domain: string;
  type?: 'profile_view' | 'connection_request';
}

export interface LogoutRequest {
  reason?: string;
}

export type ConsentRequest = Record<string, never>;

export interface Token {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  tokenDecimal: string;
  tokenPriceUSD: string;
  liquidity: string;
  l1Address: string;
  iconURL: string;
  currentBalance?: string;
}

export interface DecodedData {
  functionName: string;
  functionSignature: string;
  parameters: { name: string; value: string; type: string }[];
}

export interface TransactionRequest {
  from: string;
  to: string;
  value?: string;
  data?: string;
  gas?: string;
  gasLimit?: string;
  paymaster?: string;
  paymasterInput?: string;
}

export interface BaseEnrichedTransaction extends TransactionRequest {
  transactionType: TransactionType;
  recipient: string;
  displayValue: string;
  fee?: {
    SOPH: string;
    USD?: string;
  };
}

export interface EnrichedSOPHTransaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.SOPH;
  token: Token;
}

export interface EnrichedERC20Transaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.ERC20;
  token: Token;
}

export interface EnrichedApprovalTransaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.APPROVE;
  token: Token & { currentBalance: string };
  spender: {
    name: string;
    address: string;
    spendingCap: string;
  };
}

export interface EnrichedContractTransaction extends BaseEnrichedTransaction {
  transactionType: TransactionType.CONTRACT;
  decodedData?: {
    args: {
      name: string;
      value: string;
      type: string;
    }[];
    functionName: string;
  };
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

export type AbiFunction = {
  type: 'function';
  name: string;
  inputs?: Array<{
    name?: string;
    type: string;
    internalType?: string;
  }>;
  outputs?: Array<{
    name?: string;
    type: string;
  }>;
  stateMutability?: string;
};

export interface ContractInfo {
  abi: readonly AbiFunction[] | null;
  name: string | null;
  isVerified: boolean;
}

export interface AccountStore {
  passkey: Uint8Array | null;
  address: string | null;
  username: string | null;
  isLoggedIn: boolean;
  isInitialized: boolean;
}

export interface CreateSuccessProps {
  accountAddress: string;
  sessionPreferences: unknown;
  onUseAccount: () => Promise<void>;
  onDisconnect: () => void;
}

export interface LoginSuccessProps {
  accountData: {
    address: string;
  };
  // onUseAccount: () => Promise<void>;
  // onDisconnect: () => void;
}

export interface AccountData {
  address: string;
}

export enum AuthState {
  LOADING = 'loading',
  NOT_AUTHENTICATED = 'not_authenticated',
  SETTINGS = 'settings',
  SELECTING_WALLET = 'selecting_wallet',
  WRONG_NETWORK = 'wrong_network',
  CREATING_ACCOUNT = 'creating_account',
  WAITING_OTP = 'waiting_otp',
  WAITING_PRIMARY_WALLET = 'waiting_primary_wallet',
  LOGGING_IN = 'logging_in',
  AUTHENTICATED = 'authenticated',
  LOGIN_REQUEST = 'login_request',
  SIGNING_REQUEST = 'signing_request',
  TRANSACTION_REQUEST = 'transaction_request',
  SUCCESS = 'success',
  ERROR = 'error',
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

export interface AuthContext {
  account?: SmartAccount;
  accountAddress?: string;
  accountData?: unknown;
  error?: string;
  email?: string;
  signingRequest?: TypedDataSigningRequest;
  transactionRequest?: TransactionRequest;
  providerName?: string;
}

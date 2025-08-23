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

export interface Token {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  tokenDecimal: string;
  tokenPriceUSD: string;
  liquidity: string;
  l1Address: string;
  iconURL: string;
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
  paymaster?: string;
  paymasterInput?: string;
}

export interface EnrichedTransactionRequest extends TransactionRequest {
  from: string;
  to: string;
  transactionType: TransactionType;
  recipient?: string;
  value?: string;
  displayValue?: string;
  token?: Token;
  data?: string;
  fee?: string;
  decodedData?:
    | {
        args: {
          name: string;
          value: string;
          type: string;
        }[];
        functionName: string;
      }
    | undefined;
  contractName?: string;
}

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
  UNKNOWN = 'unknown',
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

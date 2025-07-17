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

export interface SigningRequest {
  domain: TypedDataDomain;
  types: Record<string, readonly TypedDataParameter[]>;
  primaryType: string;
  message: Record<string, unknown>;
  address: string;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  from: string;
  paymaster?: `0x${string}`;
}

export interface AccountStore {
  passkey: Uint8Array | null;
  address: string | null;
  username: string | null;
  isLoggedIn: boolean;
  isInitialized: boolean;
}

export interface SigningRequestProps {
  signingRequest: SigningRequest;
  account: SmartAccount;
  incomingRequest: IncomingRequest;
}

export interface TransactionRequestProps {
  transactionRequest: TransactionRequest;
  account: SmartAccount;
  incomingRequest: IncomingRequest;
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
  sessionPreferences: unknown;
  onUseAccount: () => Promise<void>;
  onDisconnect: () => void;
}

export interface AccountData {
  address: string;
}

export enum AuthState {
  LOADING = 'loading',
  NOT_AUTHENTICATED = 'not_authenticated',
  CREATING_ACCOUNT = 'creating_account',
  WAITING_OTP = 'waiting_otp',
  WAITING_PRIMARY_WALLET = 'waiting_primary_wallet',
  LOGGING_IN = 'logging_in',
  AUTHENTICATED = 'authenticated',
  SIGNING_REQUEST = 'signing_request',
  TRANSACTION_REQUEST = 'transaction_request',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface AuthContext {
  account?: SmartAccount;
  accountAddress?: string;
  accountData?: unknown;
  error?: string;
  email?: string;
  signingRequest?: SigningRequest;
  transactionRequest?: TransactionRequest;
}

import type { TypedDataParameter, Address, Hash } from "viem";
import { SmartAccount } from "./smart-account";

// ==========================================
// VIEM TYPE EXTENSIONS
// ==========================================

export type TypedDataDomain = {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: Address;
  salt?: Hash;
};

// ==========================================
// RPC & MESSAGE TYPES
// ==========================================

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

// ==========================================
// ACCOUNT STORE TYPES
// ==========================================

export interface AccountStore {
  passkey: Uint8Array | null;
  address: string | null;
  username: string | null;
  isLoggedIn: boolean;
  isInitialized: boolean;
}

// ==========================================
// COMPONENT PROP TYPES
// ==========================================

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
}

export interface LoginSuccessProps {
  accountData: {
    address: string;
  };
  sessionPreferences: unknown;
  onUseAccount: () => Promise<void>;
}

// ==========================================
// UI STATE TYPES
// ==========================================

export type AuthMode = "create" | "login";

export interface AccountData {
  address: string;
}

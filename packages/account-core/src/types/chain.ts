import type { Address, Hash, TypedDataParameter } from 'viem';

/**
 * Interface for the list of contract addresses used in the app.
 */
export interface ContractAddresses {
  session: `0x${string}`;
  passkey: `0x${string}`;
  accountFactory: `0x${string}`;
  accountPaymaster: `0x${string}`;
  recovery: `0x${string}`;
  oidcKeyRegistry: `0x${string}`;
  recoveryOidc: `0x${string}`;
  snsRegistry: `0x${string}`;
  accountCodeStorage: `0x${string}`;
}

export type TypedDataDomain = {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: Address;
  salt?: Hash;
};

export interface TypedDataSigningRequest {
  domain: TypedDataDomain;
  types: Record<string, readonly TypedDataParameter[]>;
  primaryType: string;
  message: Record<string, unknown>;
  address: string;
}

export interface AAFactoryAccount {
  accountId: `0x${string}`;
  factoryVersion: Address;
}

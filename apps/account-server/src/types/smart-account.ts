import type { PublicKeyCredentialDescriptorJSON } from '@simplewebauthn/browser';
import type { Address } from 'viem';

export enum Platform {
  WEB,
  MOBILE,
}

export enum AccountType {
  Passkey = 'passkey',
  EOA = 'eoa',
  EMBEDDED = 'embedded',
}

export type Signer = {
  accountType?: AccountType;
};

export type k1Signer = Signer & {
  address: Address;
};

export type PasskeySigner = Signer & {
  credential: PublicKeyCredentialDescriptorJSON;
  passkey: string;
  username: string;
  userDisplayName: string;
};

export type SmartAccount = {
  username: string;
  address: Address;
  signer?: k1Signer | PasskeySigner;
  source?: {
    platform: Platform;
    origin: string;
  };
};

import { Address } from "viem";

export enum Platform {
  WEB,
  MOBILE,
}

export enum AccountType {
  Passkey = "passkey",
  EOA = "eoa",
  EMBEDDED = "embedded",
}

export type k1Owner = {
  address: Address;
  passkey?: Uint8Array | null;
  privateKey?: string | null;
  accountType?: AccountType;
};

export type SmartAccount = {
  username: string;
  address: Address;
  owner: k1Owner;
  source?: {
    platform: Platform;
    origin: string;
  };
};

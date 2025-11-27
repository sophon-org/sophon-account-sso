import type { Wallet } from '@dynamic-labs/sdk-react-core';
import type { Address, WalletClient } from 'viem';
import type { SmartAccount } from './smart-account';

export type SignerDeps = {
  account: SmartAccount | null;
  connectedAddress?: Address;
  walletClient?: WalletClient | null;
  primaryWallet?: Wallet;
  isEOAAccount: boolean;
  verifySignature: boolean;
};

import type { ToNexusSmartAccountParameters } from '@biconomy/abstractjs';
import type { Wallet } from '@dynamic-labs/sdk-react-core';
import type { Address, WalletClient } from 'viem';
import type { SmartAccount } from '@/types/smart-account';

export type TransactionDeps = {
  account: SmartAccount | null;
  connectedAddress?: Address;
  walletClient?: WalletClient | null;
  primaryWallet?: Wallet;
  isEOAAccount: boolean;
};

export type MeeSigner = ToNexusSmartAccountParameters['signer'];

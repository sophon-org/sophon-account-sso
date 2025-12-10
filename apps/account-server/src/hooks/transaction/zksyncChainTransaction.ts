import type { Address } from 'viem';
import { http } from 'wagmi';
import { createZksyncEcdsaClient } from 'zksync-sso/client/ecdsa';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from '@/lib/constants';
import { isValidPaymaster, safeHexString } from '@/lib/utils';
import type { TransactionRequest } from '@/types/auth';
import type { SmartAccount } from '@/types/smart-account';
import type { TransactionDeps } from '@/types/transaction';
import {
  createPrimaryWalletAccount,
  createWalletAccount,
} from '../signature/localAccounts';

const buildTransactionData = (transactionRequest: TransactionRequest) => {
  const usePaymaster = isValidPaymaster(transactionRequest.paymaster);

  return {
    to: transactionRequest.to as Address,
    value: BigInt(transactionRequest.value || '0'),
    data: (transactionRequest.data as `0x${string}`) || '0x',
    paymaster: usePaymaster
      ? (transactionRequest.paymaster as Address)
      : undefined,
    paymasterInput: usePaymaster
      ? safeHexString(transactionRequest.paymasterInput)
      : undefined,
  };
};

const ensureAccountAddress = (account?: SmartAccount | null) => {
  if (!account?.address) {
    throw new Error('No account address available for transaction');
  }
  return account.address as Address;
};

const sendWithPrimaryWallet = async (
  deps: TransactionDeps,
  transactionRequest: TransactionRequest,
) => {
  const { isEthereumWallet } = await import('@dynamic-labs/ethereum');
  if (!deps.primaryWallet || !isEthereumWallet(deps.primaryWallet)) {
    return null;
  }

  const ownerAccount = await createPrimaryWalletAccount(deps.primaryWallet);
  const ecdsaClient = await createZksyncEcdsaClient({
    address: ensureAccountAddress(deps.account),
    owner: ownerAccount,
    chain: SOPHON_VIEM_CHAIN,
    transport: http(),
    contracts: {
      session: CONTRACTS.session,
    },
  });

  return ecdsaClient.sendTransaction(buildTransactionData(transactionRequest));
};

const sendWithEoa = async (
  deps: TransactionDeps,
  transactionRequest: TransactionRequest,
) => {
  if (!deps.isEOAAccount) return null;
  if (!deps.connectedAddress) {
    throw new Error('Wallet not connected for EOA transaction');
  }
  if (!deps.walletClient) {
    throw new Error('Wallet client not found for EOA transaction');
  }

  const ownerAccount = createWalletAccount(
    deps.connectedAddress as Address,
    deps.walletClient,
  );

  const client = await createZksyncEcdsaClient({
    address: ensureAccountAddress(deps.account),
    owner: ownerAccount,
    chain: SOPHON_VIEM_CHAIN,
    transport: http(),
    contracts: {
      session: CONTRACTS.session,
    },
  });

  return client.sendTransaction(buildTransactionData(transactionRequest));
};

export const createZksyncTransaction = (deps: TransactionDeps) => ({
  sendTransaction: async (transactionRequest: TransactionRequest) => {
    const primaryWalletTx = await sendWithPrimaryWallet(
      deps,
      transactionRequest,
    );
    if (primaryWalletTx) return primaryWalletTx;

    const eoaTx = await sendWithEoa(deps, transactionRequest);
    if (eoaTx) return eoaTx;

    throw new Error('No account available for transaction');
  },
});

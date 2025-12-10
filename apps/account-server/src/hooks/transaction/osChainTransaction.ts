import {
  createMeeClient,
  getDefaultMEENetworkUrl,
  getDefaultMeeGasTank,
  getMEEVersion,
  MEEVersion,
  toMultichainNexusAccount,
} from '@biconomy/abstractjs';
import type { Address } from 'viem';

import { http } from 'viem';
import { SOPHON_VIEM_CHAIN } from '@/lib/constants';
import type { TransactionRequest } from '@/types/auth';
import type { MeeSigner, TransactionDeps } from '@/types/transaction';
import {
  createPrimaryWalletAccount,
  createWalletAccount,
} from '../signature/localAccounts';

const isStaging = true; // select staging environment for testnet access
const sponsorshipApiKey = 'mee_3Zmc7H6Pbd5wUfUGu27aGzdf'; // default staging api key (rate limited) with sponsorship enabled
const meeNetworkUrl = getDefaultMEENetworkUrl(isStaging);
const meeGasTank = getDefaultMeeGasTank(isStaging);

const buildTransactionData = (transactionRequest: TransactionRequest) => {
  const gasLimit =
    transactionRequest.gasLimit || transactionRequest.gas || undefined;

  return {
    to: transactionRequest.to as `0x${string}`,
    value: BigInt(transactionRequest.value || '0'),
    data: (transactionRequest.data as `0x${string}`) || '0x',
    ...(gasLimit ? { gasLimit: BigInt(gasLimit) } : {}),
  };
};

const executeMeeTransaction = async (
  ownerAccount: MeeSigner,
  transactionRequest: TransactionRequest,
  accountAddress?: Address,
) => {
  const smartAccount = await toMultichainNexusAccount({
    signer: ownerAccount,
    chainConfigurations: [
      {
        chain: SOPHON_VIEM_CHAIN,
        transport: http(),
        version: getMEEVersion(MEEVersion.V2_1_0),
        ...(accountAddress ? { accountAddress } : {}),
      },
    ],
  });

  const instructions = await smartAccount.build({
    type: 'default',
    data: {
      calls: [
        {
          ...buildTransactionData(transactionRequest),
        },
      ],
      chainId: SOPHON_VIEM_CHAIN.id,
    },
  });

  const meeClient = await createMeeClient({
    account: smartAccount,
    url: meeNetworkUrl,
    apiKey: sponsorshipApiKey,
  });

  const result = await meeClient.execute({
    instructions,
    sponsorship: true,
    sponsorshipOptions: {
      url: meeNetworkUrl,
      gasTank: meeGasTank,
    },
  });

  return result.hash;
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
  return executeMeeTransaction(
    ownerAccount,
    transactionRequest,
    deps.account?.address as Address | undefined,
  );
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

  return executeMeeTransaction(
    ownerAccount,
    transactionRequest,
    deps.account?.address as Address | undefined,
  );
};

export const createOsChainTransaction = (deps: TransactionDeps) => ({
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

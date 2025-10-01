import {
  type Account,
  type Chain,
  createWalletClient,
  http,
  type Transport,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { eip712WalletActions } from 'viem/zksync';
import { deployModularAccount } from 'zksync-sso/client';
import { env } from '@/env';
import { CONTRACTS, SOPHON_VIEM_CHAIN } from './constants';
import {
  getDeployedSmartContractAddress,
  SOPHON_SALT_PREFIX,
} from './smart-contract';

const MAX_RETRIES = 5;
const RETRY_DELAY = 500;

// this part should be on the backend
export const deployAccount = async (ownerAddress: `0x${string}`) => {
  const deployerAccount = privateKeyToAccount(
    env.DEPLOYER_PRIVATE_KEY as `0x${string}`,
  );

  const deployedAddress = await getDeployedSmartContractAddress(ownerAddress);
  if (deployedAddress) {
    return { address: deployedAddress };
  }

  const deployerClient: WalletClient<Transport, Chain, Account> =
    createWalletClient({
      account: deployerAccount,
      chain: SOPHON_VIEM_CHAIN,
      transport: http(),
    }).extend(eip712WalletActions());

  let retries = MAX_RETRIES;

  do {
    try {
      const deployedAccount = await deployModularAccount(deployerClient, {
        accountFactory: CONTRACTS.accountFactory,
        paymaster: {
          location: CONTRACTS.accountPaymaster,
        },
        uniqueAccountId: SOPHON_SALT_PREFIX,
        owners: [ownerAddress],
        installNoDataModules: [],
      });

      return deployedAccount;
    } catch (error) {
      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  } while (--retries > 0);

  throw new Error(`Failed to deploy account for owner: ${ownerAddress}`);
};

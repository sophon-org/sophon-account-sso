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
  getAccountAddressByUniqueId,
  getDynamicSmartAccountUniqueId,
  getSophonSmartAccountUniqueId,
  SOPHON_SALT_PREFIX,
} from './smart-contract';

const MAX_RETRIES = 5;
const RETRY_DELAY = 500;
const NON_EXISTING = '0x0000000000000000000000000000000000000000';

// this part should be on the backend
export const deployAccount = async (ownerAddress: `0x${string}`) => {
  const deployerAccount = privateKeyToAccount(
    env.DEPLOYER_PRIVATE_KEY as `0x${string}`,
  );

  const [dynamicAccountAddress, sophonAccountAddress] = await Promise.all([
    getAccountAddressByUniqueId(getDynamicSmartAccountUniqueId(ownerAddress)),
    getAccountAddressByUniqueId(
      getSophonSmartAccountUniqueId(ownerAddress, deployerAccount.address),
    ),
  ]);

  if (dynamicAccountAddress && dynamicAccountAddress !== NON_EXISTING) {
    console.log('account already deployed on sophon v1', dynamicAccountAddress);
    return { address: dynamicAccountAddress };
  }

  if (sophonAccountAddress && sophonAccountAddress !== NON_EXISTING) {
    console.log('account already deployed on sophon v2', sophonAccountAddress);
    return { address: sophonAccountAddress };
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

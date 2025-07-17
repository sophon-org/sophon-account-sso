import { eip712WalletActions } from "viem/zksync";
import { CONTRACTS, VIEM_CHAIN } from "./constants";
import { deployModularAccount } from "zksync-sso/client";
import {
  Account,
  Chain,
  createWalletClient,
  http,
  Transport,
  WalletClient,
} from "viem";
import { getSmartAccountUniqueId } from "./smart-contract";
import { privateKeyToAccount } from "viem/accounts";
import { env } from "@/env";

// this part should be on the backend
export const deployAccount = async (ownerAddress: `0x${string}`) => {
  const deployerAccount = privateKeyToAccount(
    env.DEPLOYER_PRIVATE_KEY as `0x${string}`
  );

  const deployerClient: WalletClient<Transport, Chain, Account> =
    createWalletClient({
      account: deployerAccount,
      chain: VIEM_CHAIN,
      transport: http(),
    }).extend(eip712WalletActions());

  const deployedAccount = await deployModularAccount(deployerClient, {
    accountFactory: CONTRACTS.accountFactory,
    paymaster: {
      location: CONTRACTS.accountPaymaster,
    },
    uniqueAccountId: getSmartAccountUniqueId(ownerAddress),
    owners: [ownerAddress! as `0x${string}`],
    installNoDataModules: [],
  });

  return deployedAccount;
};

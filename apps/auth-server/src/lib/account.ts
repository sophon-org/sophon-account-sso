import { eip712WalletActions } from "viem/zksync";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "./constants";
import { deployModularAccount } from "zksync-sso/client";
import {
  Account,
  Chain,
  createWalletClient,
  http,
  Transport,
  WalletClient,
} from "viem";
import { sophonTestnet } from "viem/chains";
import { getSmartAccountUniqueId } from "./utils";
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
      chain: sophonTestnet,
      transport: http("https://rpc.testnet.sophon.xyz"),
    }).extend(eip712WalletActions());

  const contracts = CHAIN_CONTRACTS[DEFAULT_CHAIN_ID];
  const deployedAccount = await deployModularAccount(deployerClient, {
    accountFactory: contracts.accountFactory as `0x${string}`,
    paymaster: {
      location: contracts.accountPaymaster as `0x${string}`,
    },
    uniqueAccountId: getSmartAccountUniqueId(ownerAddress),
    owners: [ownerAddress! as `0x${string}`],
    installNoDataModules: [],
  });

  return deployedAccount;
};

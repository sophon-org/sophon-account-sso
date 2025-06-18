// src/hooks/useAccountCreate.ts
"use client";
import { useState } from "react";
import { deployModularAccount } from "zksync-sso/client";
import { registerNewPasskey } from "zksync-sso/client/passkey";
import { createWalletClient, http } from "viem";
import { eip712WalletActions } from "viem/zksync";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sophonTestnet } from "viem/chains";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import { useAccountStore } from "./useAccountState";

export const useAccountCreate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountAddress, setAccountAddress] = useState<string>("");

  const { login } = useAccountStore();

  const createAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      const passkeyName = `Sophon Account ${new Date().toLocaleString()}`;

      const passkeyResult = await registerNewPasskey({
        userName: passkeyName,
        userDisplayName: passkeyName,
      });

      const ownerKey = generatePrivateKey();
      const ownerAccount = privateKeyToAccount(ownerKey);
      const ownerAddress = ownerAccount.address;
      console.log("Owner address:", ownerAddress);

      const deployerClient = createWalletClient({
        account: ownerAccount,
        chain: sophonTestnet,
        transport: http("https://rpc.testnet.sophon.xyz"),
      }).extend(eip712WalletActions());

      const contracts = CHAIN_CONTRACTS[DEFAULT_CHAIN_ID];

      try {
        const deployedAccount = await deployModularAccount(deployerClient, {
          accountFactory: contracts.accountFactory as `0x${string}`,
          passkeyModule: {
            location: contracts.passkey as `0x${string}`,
            credentialId: passkeyResult.credentialId,
            credentialPublicKey: passkeyResult.credentialPublicKey,
          },
          paymaster: {
            location: contracts.accountPaymaster as `0x${string}`,
          },
          uniqueAccountId: passkeyResult.credentialId,
          sessionModule: {
            location: contracts.session as `0x${string}`,
            initialSession: undefined,
          },
          owners: [ownerAddress],
          installNoDataModules: [contracts.recovery as `0x${string}`],
        });

        console.log(
          "deployModularAccount completed successfully:",
          deployedAccount.transactionReceipt
        );

        console.log("Account deployed successfully!", deployedAccount.address);
        setAccountAddress(deployedAccount.address);

        login({
          username: passkeyName,
          address: deployedAccount.address,
          passkey: passkeyResult.credentialId as `0x${string}`,
        });

        setSuccess(true);
      } catch (deployError: unknown) {
        console.error("deployModularAccount failed:", deployError);
        throw deployError;
      }
    } catch (err: unknown) {
      console.error("Account creation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return {
    createAccount,
    loading,
    error,
    success,
    accountAddress,
  };
};

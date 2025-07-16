"use client";
import { useState } from "react";
import { useWalletClient } from "wagmi";
import { deployModularAccount } from "zksync-sso/client";
import { registerNewPasskey } from "zksync-sso/client/passkey";
import { createWalletClient, http } from "viem";
import { eip712WalletActions } from "viem/zksync";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sophonTestnet } from "viem/chains";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import { useAccountContext } from "./useAccountContext";
import { checkAccountOwnership } from "@/lib/utils";
import { env } from "@/env";

export const useAccountCreate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountAddress, setAccountAddress] = useState<string>("");

  const { login } = useAccountContext();
  const { data: walletClient } = useWalletClient();

  const deployAccount = async (connectedAddress: string) => {
    const deployerClient = walletClient!.extend(eip712WalletActions());
    const contracts = CHAIN_CONTRACTS[DEFAULT_CHAIN_ID];
    const deployedAccount = await deployModularAccount(deployerClient, {
      accountFactory: contracts.accountFactory as `0x${string}`,
      paymaster: {
        location: contracts.accountPaymaster as `0x${string}`,
      },
      //uniqueAccountId: connectedAddress as `0x${string}`,
      owners: [connectedAddress! as `0x${string}`], // Connected wallet as owner
      installNoDataModules: [], // Empty - no modules for pure EOA account
    });

    setAccountAddress(deployedAccount.address);

    login({
      username: `EOA Account ${connectedAddress!.slice(0, 8)}...`,
      address: deployedAccount.address,
      owner: {
        address: connectedAddress! as `0x${string}`,
        passkey: null,
        privateKey: null,
      },
    });

    setSuccess(true);
  };

  const createAccount = async (
    accountType: "passkey" | "eoa",
    connectedAddress?: string
  ) => {
    console.log("Creating account with type:", accountType);
    if (accountType === "passkey") {
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

          setAccountAddress(deployedAccount.address);

          login({
            username: passkeyName,
            address: deployedAccount.address,
            owner: {
              address: ownerAddress,
              passkey: passkeyResult.credentialPublicKey,
            },
          });

          setSuccess(true);
        } catch (deployError: unknown) {
          console.error("deployModularAccount failed:", deployError);
          throw deployError;
        }
      } catch (err: unknown) {
        console.error("Account creation failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create account"
        );
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        setError(null);

        if (!connectedAddress) {
          throw new Error(
            "No wallet connected. Please connect your wallet first."
          );
        }

        if (!walletClient) {
          throw new Error(
            "Wallet client not available. Please ensure your wallet is connected."
          );
        }

        console.log("Checking account ownership for", connectedAddress);

        const existingAccountAddress = await checkAccountOwnership(
          connectedAddress,
          env.NEXT_PUBLIC_DEPLOYER_ADDRESS as `0x${string}`
        );
        if (
          existingAccountAddress &&
          existingAccountAddress !==
            "0x0000000000000000000000000000000000000000"
        ) {
          login({
            username: `EOA Account ${connectedAddress.slice(0, 8)}...`,
            address: existingAccountAddress,
            owner: {
              address: connectedAddress as `0x${string}`,
              passkey: null,
              privateKey: null,
            },
          });
          setAccountAddress(existingAccountAddress);
          setSuccess(true);
          return;
        } else {
          console.log("No existing account found, deploying new account");
          await deployAccount(connectedAddress);
        }
      } catch (checkError) {
        console.error("❌ Account check failed:", checkError);
      } finally {
        setLoading(false);
      }
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

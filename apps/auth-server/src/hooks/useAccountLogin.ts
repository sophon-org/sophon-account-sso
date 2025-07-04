"use client";
import { useState } from "react";
import { fetchAccount } from "zksync-sso/client";
import { createPublicClient, http } from "viem";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import { sophonTestnet } from "viem/chains";
import { useAccountContext } from "./useAccountContext";

export const useAccountLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountData, setAccountData] = useState<{
    username: string;
    address: string;
    passkeyPublicKey: string;
  } | null>(null);

  const { login } = useAccountContext();

  const loginToAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required",
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("No passkey credential provided");
      }

      const publicClient = createPublicClient({
        chain: sophonTestnet,
        transport: http("https://rpc.testnet.sophon.xyz"),
      });

      const contracts = CHAIN_CONTRACTS[DEFAULT_CHAIN_ID];

      // @ts-expect-error - fetchAccount type compatibility for testing
      const accountInfo = await fetchAccount(publicClient, {
        contracts: {
          accountFactory: contracts.accountFactory as `0x${string}`,
          passkey: contracts.passkey as `0x${string}`,
          session: contracts.session as `0x${string}`,
          recovery: contracts.recovery as `0x${string}`,
        },
        uniqueAccountId: credential.id,
      });

      const loginData = {
        username: accountInfo.username,
        address: accountInfo.address,
        passkeyPublicKey: accountInfo.passkeyPublicKey.toString(),
      };
      setAccountData(loginData);

      login({
        username: accountInfo.username,
        address: accountInfo.address,
        owner: {
          address: accountInfo.address,
          passkey: accountInfo.passkeyPublicKey,
        },
      });

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Account login failed:", err);

      const errorMessage = "Failed to login to account";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loginToAccount,
    loading,
    error,
    success,
    accountData,
  };
};

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useAccountStore } from "./useAccountState";
import { createZksyncPasskeyClient } from "zksync-sso/client/passkey";
import { http } from "viem";
import { sophonTestnet } from "viem/chains";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import { parseEther } from "viem";

export const useCreateSession = () => {
  const accountStore = useAccountStore();

  const createSession = async () => {
    // TODO: Integrate this into button handlers
    console.log("Session creation requested for:", accountStore.address);

    try {
      // Generate session key
      const sessionKey = generatePrivateKey();
      const sessionSigner = privateKeyToAccount(sessionKey);

      // ✅ Get passkey data from account store (now stored as hex, retrieved as bytes)
      if (
        !accountStore.isLoggedIn ||
        !accountStore.passkey ||
        !accountStore.address
      ) {
        throw new Error(
          "No passkey data available - account may not be fully created yet"
        );
      }

      const accountAddress = accountStore.address;

      const client = createZksyncPasskeyClient({
        address: accountAddress as `0x${string}`,
        credentialPublicKey: accountStore.passkey,
        userName: accountStore.username || "Sophon User",
        userDisplayName: accountStore.username || "Sophon User",
        contracts: {
          accountFactory: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID]
            .accountFactory as `0x${string}`,
          passkey: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID].passkey as `0x${string}`,
          session: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID].session as `0x${string}`,
          recovery: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID].recovery as `0x${string}`,
        },
        chain: sophonTestnet,
        transport: http("https://rpc.testnet.sophon.xyz"),
      });

      const sessionConfig = {
        signer: sessionSigner.address,
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24), // 24 hours
        feeLimit: {
          limitType: 0,
          limit: parseEther("0.01"),
          period: BigInt(0),
        },
        callPolicies: [], // Empty - allow message signing
        transferPolicies: [], // Empty - allow message signing
      };

      console.log("📄 Session config:", sessionConfig);
      console.log("🔐 Account address:", accountAddress);
      console.log("🗝️ Session signer:", sessionSigner.address);

      // Generate a unique session signer each time to avoid conflicts
      const timestamp = Date.now();
      console.log("⏰ Session timestamp:", timestamp);

      const sessionPromise = client.createSession({
        sessionConfig,
      });

      // Add timeout protection to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(new Error("Session creation timed out after 30 seconds")),
          30000
        );
      });

      const result = (await Promise.race([
        sessionPromise,
        timeoutPromise,
      ])) as unknown;

      console.log(
        "✅ Session created successfully:",
        (result as { transactionReceipt?: { transactionHash?: string } })
          ?.transactionReceipt?.transactionHash
      );

      return {
        sessionKey,
        sessionConfig: {
          signer: sessionConfig.signer,
          expiresAt: sessionConfig.expiresAt.toString(),
          feeLimit: {
            limitType: sessionConfig.feeLimit.limitType,
            limit: sessionConfig.feeLimit.limit.toString(),
            period: sessionConfig.feeLimit.period.toString(),
          },
          callPolicies: [],
          transferPolicies: [],
        },
      };
    } catch (error) {
      console.error("❌ Session creation failed:", error);
      console.log("🔄 Falling back to regular connection (no session)");
      return null; // Fallback to regular connection
    }
  };

  return createSession;
};

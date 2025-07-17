import { useAccount, useWalletClient } from "wagmi";
import { createZksyncPasskeyClient } from "zksync-sso/client/passkey";
import { createZksyncEcdsaClient } from "zksync-sso/client/ecdsa";
import { sophonTestnet } from "viem/chains";
import { http } from "viem";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import type { SigningRequestProps } from "@/types/auth";
import { toAccount } from "viem/accounts";
import { verifyEIP1271Signature } from "@/lib/utils";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { Loader } from "@/components/loader";
import { useState } from "react";
import { windowService } from "@/service/window.service";

export default function SigningRequestView({
  signingRequest,
  account,
  incomingRequest,
}: SigningRequestProps) {
  const [isSigning, setIsSigning] = useState(false);
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-blue-600">Sign Message</h2>
      <p className="mt-2 text-sm text-gray-600">
        Please review and sign this message
      </p>

      <div className="mt-4 p-3 bg-gray-50 rounded border text-left">
        <p className="text-xs text-gray-500 mb-2">Typed Data to sign:</p>
        <div className="text-sm text-black">
          <p>
            <strong>Domain:</strong> {signingRequest.domain.name} v
            {signingRequest.domain.version}
          </p>
          <p>
            <strong>Type:</strong> {signingRequest.primaryType}
          </p>
          <pre className="text-xs mt-2 whitespace-pre-wrap break-words">
            {JSON.stringify(signingRequest.message, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded border">
        <p className="text-xs text-gray-500">Signing Address:</p>
        <p className="text-sm font-mono break-all text-blue-600">
          {signingRequest.address}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={async () => {
            try {
              setIsSigning(true);
              try {
                const availableAddress =
                  account.address || primaryWallet?.address;
                if (!availableAddress) {
                  throw new Error("No account address available");
                }

                const isEOAAccount = !account.owner.passkey;

                let signature;

                if (primaryWallet && isEthereumWallet(primaryWallet)) {
                  console.log("🔥🔥🔥🔥🔥 Signing with Ethereum wallet");
                  try {
                    const client = await primaryWallet.getWalletClient();
                    signature = await client.signTypedData({
                      domain: signingRequest.domain,
                      types: signingRequest.types,
                      primaryType: signingRequest.primaryType,
                      message: signingRequest.message,
                    });
                  } catch (error) {
                    console.error("Signing error:", error);
                    throw error;
                  }
                } else if (isEOAAccount) {
                  if (!connectedAddress) {
                    throw new Error("Wallet not connected for EOA signing!");
                  }

                  const localAccount = toAccount({
                    address: connectedAddress,
                    async signMessage({ message }) {
                      const signature = await walletClient?.signMessage({
                        message,
                      });
                      if (!signature) throw new Error("Failed to sign message");
                      return signature;
                    },
                    async signTransaction(transaction) {
                      const signature = await walletClient?.signTransaction(
                        // @ts-expect-error - Type mismatch between viem account interface and wallet client
                        transaction
                      );
                      if (!signature)
                        throw new Error("Failed to sign transaction");
                      return signature;
                    },
                    async signTypedData(typedData) {
                      const signature = await walletClient?.signTypedData(
                        // @ts-expect-error - Type mismatch between viem account interface and wallet client
                        typedData
                      );
                      if (!signature)
                        throw new Error("Failed to sign typed data");
                      return signature;
                    },
                  });

                  const client = await createZksyncEcdsaClient({
                    address: account.address as `0x${string}`,
                    owner: localAccount,
                    chain: sophonTestnet,
                    transport: http(),
                    contracts: {
                      session: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID]
                        .session as `0x${string}`,
                    },
                  });

                  signature = await client.signTypedData({
                    domain: signingRequest.domain,
                    types: signingRequest.types,
                    primaryType: signingRequest.primaryType,
                    message: signingRequest.message,
                  });

                  await verifyEIP1271Signature({
                    accountAddress: signingRequest.address,
                    signature,
                    domain: signingRequest.domain,
                    types: signingRequest.types,
                    primaryType: signingRequest.primaryType,
                    message: signingRequest.message,
                  });
                } else {
                  if (!account.owner.passkey) {
                    throw new Error("No passkey data available for signing");
                  }

                  const client = createZksyncPasskeyClient({
                    address: account.address as `0x${string}`,
                    credentialPublicKey: account.owner.passkey,
                    userName: account.username || "Sophon User",
                    userDisplayName: account.username || "Sophon User",
                    contracts: {
                      accountFactory: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID]
                        .accountFactory as `0x${string}`,
                      passkey: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID]
                        .passkey as `0x${string}`,
                      session: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID]
                        .session as `0x${string}`,
                      recovery: CHAIN_CONTRACTS[DEFAULT_CHAIN_ID]
                        .recovery as `0x${string}`,
                    },
                    chain: sophonTestnet,
                    transport: http("https://rpc.testnet.sophon.xyz"),
                  });

                  signature = await client.signTypedData({
                    domain: signingRequest.domain,
                    types: signingRequest.types,
                    primaryType: signingRequest.primaryType,
                    message: signingRequest.message,
                  });

                  await verifyEIP1271Signature({
                    accountAddress: signingRequest.address,
                    signature,
                    domain: signingRequest.domain,
                    types: signingRequest.types,
                    primaryType: signingRequest.primaryType,
                    message: signingRequest.message,
                  });
                }

                if (windowService.isManaged() && incomingRequest) {
                  const signResponse = {
                    id: crypto.randomUUID(),
                    requestId: incomingRequest.id,
                    content: {
                      result: signature,
                    },
                  };

                  windowService.sendMessage(signResponse);
                  windowService.close();
                }
              } catch (error) {
                console.error("Signing failed:", error);
                alert("Signing failed: " + (error as Error).message);
              }
            } finally {
              setIsSigning(false);
            }
          }}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isSigning ? <Loader className="w-4 h-4" /> : "Sign Message"}
        </button>

        <button
          onClick={() => {
            if (windowService.isManaged() && incomingRequest) {
              const signResponse = {
                id: crypto.randomUUID(),
                requestId: incomingRequest.id,
                content: {
                  result: null,
                  error: {
                    message: "User cancelled signing",
                    code: -32002,
                  },
                },
              };

              windowService.sendMessage(signResponse);
            }
            windowService.close();
          }}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

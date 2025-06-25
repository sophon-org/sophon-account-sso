import { useAccount, useWalletClient } from "wagmi";
import { createZksyncPasskeyClient } from "zksync-sso/client/passkey";
import { createZksyncEcdsaClient } from "zksync-sso/client/ecdsa";
import { sophonTestnet } from "viem/chains";
import { http } from "viem";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import type { SigningRequestProps } from "@/types/auth";
import { toAccount } from "viem/accounts";
import { verifyEIP1271Signature } from "@/lib/utils";

export default function SigningRequestView({
  signingRequest,
  accountStore,
  incomingRequest,
}: SigningRequestProps) {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
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
                  if (!accountStore.address) {
                    throw new Error("No account address available");
                  }

                  const isEOAAccount = !accountStore.passkey;

                  let signature;

                  if (isEOAAccount) {
                    if (!connectedAddress) {
                      throw new Error("Wallet not connected for EOA signing!");
                    }

                    const localAccount = toAccount({
                      address: connectedAddress,
                      async signMessage({ message }) {
                        const signature = await walletClient?.signMessage({
                          message,
                        });
                        if (!signature)
                          throw new Error("Failed to sign message");
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
                      address: accountStore.address as `0x${string}`,
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
                    if (!accountStore.passkey) {
                      throw new Error("No passkey data available for signing");
                    }

                    const client = createZksyncPasskeyClient({
                      address: accountStore.address as `0x${string}`,
                      credentialPublicKey: accountStore.passkey,
                      userName: accountStore.username || "Sophon User",
                      userDisplayName: accountStore.username || "Sophon User",
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

                  if (window.opener && incomingRequest) {
                    const signResponse = {
                      id: crypto.randomUUID(),
                      requestId: incomingRequest.id,
                      content: {
                        result: signature,
                      },
                    };

                    window.opener.postMessage(signResponse, "*");
                    //window.close();
                  }
                } catch (error) {
                  console.error("❌ Signing failed:", error);
                  alert("Signing failed: " + (error as Error).message);
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign Message
            </button>

            <button
              onClick={() => {
                console.log("❌ User cancelled signing");
                window.close();
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

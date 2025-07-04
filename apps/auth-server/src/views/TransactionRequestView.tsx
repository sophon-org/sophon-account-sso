import { formatEther } from "viem";
import { createZksyncPasskeyClient } from "zksync-sso/client/passkey";
import { sophonTestnet } from "viem/chains";
import { http } from "viem";
import { CHAIN_CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import type { TransactionRequestProps } from "@/types/auth";
import { createZksyncEcdsaClient } from "zksync-sso/client/ecdsa";
import { toAccount } from "viem/accounts";
import { useAccount, useWalletClient } from "wagmi";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isZKsyncConnector } from "@dynamic-labs/ethereum-aa-zksync";

export default function TransactionRequestView({
  transactionRequest,
  account,
  incomingRequest,
}: TransactionRequestProps) {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { primaryWallet } = useDynamicContext();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-purple-600">
            Send Transaction
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please review and confirm this transaction
          </p>

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-gray-50 rounded border text-left">
              <p className="text-xs text-gray-500">To:</p>
              <p className="text-sm font-mono break-all text-black">
                {transactionRequest.to}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded border text-left">
              <p className="text-xs text-gray-500">Value:</p>
              <p className="text-sm text-black">
                {transactionRequest.value && transactionRequest.value !== "0x0"
                  ? `${formatEther(BigInt(transactionRequest.value))} SOPH`
                  : "0 SOPH"}
              </p>
            </div>

            {transactionRequest.data && transactionRequest.data !== "0x" && (
              <div className="p-3 bg-gray-50 rounded border text-left">
                <p className="text-xs text-gray-500">Data:</p>
                <p className="text-xs font-mono break-all text-black">
                  {transactionRequest.data}
                </p>
              </div>
            )}

            <div className="p-3 bg-purple-50 rounded border">
              <p className="text-xs text-gray-500">From:</p>
              <p className="text-sm font-mono break-all text-purple-600">
                {transactionRequest.from}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={async () => {
                console.log(transactionRequest);
                const availableAddress =
                  account.address || primaryWallet?.address;
                if (!availableAddress) {
                  throw new Error("No account address available");
                }
                try {
                  const isEOAAccount = !account.owner.passkey;
                  let txHash;
                  if (primaryWallet && isEthereumWallet(primaryWallet)) {
                    console.log("Sending transaction with Ethereum wallet...");
                    try {
                      if (isZKsyncConnector(primaryWallet.connector)) {
                        const ecdsaClient =
                          primaryWallet.connector.getAccountAbstractionProvider();

                        txHash = await ecdsaClient.sendTransaction({
                          to: transactionRequest.to as `0x${string}`,
                          value: BigInt(transactionRequest.value || "0"),
                          data:
                            (transactionRequest.data as `0x${string}`) || "0x",
                        });

                        console.log("Transaction sent:", txHash);
                      }
                    } catch (error) {
                      console.error("Transaction error:", error);
                      throw error;
                    }
                  } else if (isEOAAccount) {
                    console.log("Sending transaction with EOA...");
                    const localAccount = toAccount({
                      address: connectedAddress as `0x${string}`,
                      async signMessage({ message }) {
                        const signature = await walletClient?.signMessage({
                          message,
                        });
                        if (!signature)
                          throw new Error("Failed to sign message");
                        return signature; // Now guaranteed to be Hex
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

                    try {
                      const gasEstimate = await client.estimateGas({
                        to: transactionRequest.to as `0x${string}`,
                        value: BigInt(transactionRequest.value || "0"),
                        data:
                          (transactionRequest.data as `0x${string}`) || "0x",
                      });
                      console.log("Gas estimate:", gasEstimate.toString());
                    } catch (gasError) {
                      console.error("Gas estimation failed:", gasError);
                    }

                    txHash = await client.sendTransaction({
                      to: transactionRequest.to as `0x${string}`,
                      value: BigInt(transactionRequest.value || "0"),
                      data: (transactionRequest.data as `0x${string}`) || "0x",
                    });
                  } else {
                    console.log("Sending transaction with Passkey...");
                    if (!account.passkey) {
                      throw new Error("No passkey data available");
                    }

                    const client = createZksyncPasskeyClient({
                      address: account.address as `0x${string}`,
                      credentialPublicKey: account.passkey,
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

                    try {
                      const gasEstimate = await client.estimateGas({
                        to: transactionRequest.to as `0x${string}`,
                        value: BigInt(transactionRequest.value || "0"),
                        data:
                          (transactionRequest.data as `0x${string}`) || "0x",
                      });
                      console.log("Gas estimate:", gasEstimate.toString());
                    } catch (gasError) {
                      console.error("Gas estimation failed:", gasError);
                    }

                    txHash = await client.sendTransaction({
                      to: transactionRequest.to as `0x${string}`,
                      value: BigInt(transactionRequest.value || "0"),
                      data: (transactionRequest.data as `0x${string}`) || "0x",
                      /* paymaster: transactionRequest.paymaster as `0x${string}`,
                      paymasterInput: getGeneralPaymasterInput({
                        innerInput: "0x",
                      }), */
                    });
                  }

                  console.log("Transaction sent:", txHash);

                  if (window.opener && incomingRequest) {
                    const txResponse = {
                      id: crypto.randomUUID(),
                      requestId: incomingRequest.id,
                      content: {
                        result: txHash,
                      },
                    };

                    window.opener.postMessage(txResponse, "*");
                    window.close();
                  }
                } catch (error) {
                  console.error("Transaction failed:", error);
                  alert("Transaction failed: " + (error as Error).message);
                }
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Send Transaction
            </button>

            <button
              onClick={() => {
                console.log("User cancelled transaction");
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

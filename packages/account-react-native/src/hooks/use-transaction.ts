// import { useState } from "react";
// import { http } from "viem";
// import { toAccount } from "viem/accounts";
// import { useAccount, useWalletClient } from "wagmi";

// import { isEthereumWallet } from "@dynamic-labs/ethereum";
// import { useSophonContext } from "./use-sophon-context";

// export function useTransaction() {
//   const { account, walletClient: dynamicClient, chain } = useSophonContext();
//   const { address: connectedAddress } = useAccount();
//   const { data: walletClient } = useWalletClient();
//   const [isSending, setIsSending] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const sendTransaction = async (
//     transactionRequest: TransactionRequest,
//     incomingRequest?: IncomingRequest,
//   ) => {
//     setIsSending(true);
//     const availableAddress = account?.address;
//     if (!availableAddress) {
//       throw new Error("No account address available");
//     }
//     try {
//       const isEOAAccount = !account?.owner;
//       let txHash: string = "";

//       if (dynamicClient && isEthereumWallet(dynamicClient)) {
//         try {
//           const client = await dynamicClient.getWalletClient();

//           const localAccount = toAccount({
//             address: account?.address as `0x${string}`,
//             async signMessage({ message }) {
//               const signature = await client?.signMessage({
//                 message,
//               });
//               if (!signature) throw new Error("Failed to sign message");
//               return signature; // Now guaranteed to be Hex
//             },
//             async signTransaction(transaction) {
//               const signature = await client?.signTransaction(
//                 // @ts-expect-error - Type mismatch between viem account interface and wallet client
//                 transaction,
//               );
//               if (!signature) throw new Error("Failed to sign transaction");
//               return signature;
//             },
//             async signTypedData(typedData) {
//               const signature = await client?.signTypedData(
//                 // @ts-expect-error - Type mismatch between viem account interface and wallet client
//                 safeParseTypedData(typedData),
//               );
//               if (!signature) throw new Error("Failed to sign typed data");
//               return signature;
//             },
//           });

//           const ecdsaClient = await createZksyncEcdsaClient({
//             address: account?.address as `0x${string}`,
//             owner: localAccount,
//             chain,
//             transport: http(),
//             contracts: {
//               session: CONTRACTS.session,
//             },
//           });

//           // const usePaymaster = isValidPaymaster(transactionRequest.paymaster);

//           txHash = await ecdsaClient.sendTransaction({
//             to: transactionRequest.to as `0x${string}`,
//             value: BigInt(transactionRequest.value || "0"),
//             data: (transactionRequest.data as `0x${string}`) || "0x",
//             // paymaster: usePaymaster ? (transactionRequest.paymaster as `0x${string}`) : undefined,
//             // paymasterInput: usePaymaster
//             //   ? safeHexString(transactionRequest.paymasterInput)
//             //   : undefined,
//           });
//         } catch (error) {
//           console.error("Transaction error:", error);
//           throw error;
//         }
//       } else if (isEOAAccount) {
//         console.log("Sending transaction with EOA...");
//         const localAccount = toAccount({
//           address: connectedAddress as `0x${string}`,
//           async signMessage({ message }) {
//             const signature = await walletClient?.signMessage({
//               message,
//             });
//             if (!signature) throw new Error("Failed to sign message");
//             return signature; // Now guaranteed to be Hex
//           },
//           async signTransaction(transaction) {
//             const signature = await walletClient?.signTransaction(transaction);
//             if (!signature) throw new Error("Failed to sign transaction");
//             return signature;
//           },
//           async signTypedData(typedData) {
//             const signature = await walletClient?.signTypedData(typedData);
//             if (!signature) throw new Error("Failed to sign typed data");
//             return signature;
//           },
//         });

//         const client = await createZksyncEcdsaClient({
//           address: account?.address as `0x${string}`,
//           owner: localAccount,
//           chain: SOPHON_VIEM_CHAIN,
//           transport: http(),
//           contracts: {
//             session: CONTRACTS.session,
//           },
//         });

//         const usePaymaster = isValidPaymaster(transactionRequest.paymaster);

//         const txData = {
//           to: transactionRequest.to as `0x${string}`,
//           value: BigInt(transactionRequest.value || "0"),
//           data: (transactionRequest.data as `0x${string}`) || "0x",
//           paymaster: usePaymaster ? (transactionRequest.paymaster as `0x${string}`) : undefined,
//           paymasterInput: usePaymaster
//             ? safeHexString(transactionRequest.paymasterInput)
//             : undefined,
//         };

//         txHash = await client.sendTransaction(txData);
//       } else {
//         console.log("Sending transaction with Passkey...");
//         if (!account.owner) {
//           throw new Error("No passkey data available");
//         }

//         const client = createZksyncPasskeyClient({
//           address: account.address,
//           credentialPublicKey: account.owner,
//           userName: account.username || "Sophon User",
//           userDisplayName: account.username || "Sophon User",
//           contracts: CONTRACTS,
//           chain: SOPHON_VIEM_CHAIN,
//           transport: http(),
//         });

//         const usePaymaster = isValidPaymaster(transactionRequest.paymaster);

//         txHash = await client.sendTransaction({
//           to: transactionRequest.to as `0x${string}`,
//           value: BigInt(transactionRequest.value || "0"),
//           data: (transactionRequest.data as `0x${string}`) || "0x",
//           paymaster: usePaymaster ? (transactionRequest.paymaster as `0x${string}`) : undefined,
//           paymasterInput: usePaymaster
//             ? safeHexString(transactionRequest.paymasterInput)
//             : undefined,
//         });
//       }
//     } catch (error) {
//       console.error("Transaction failed:", error);
//       setError(error instanceof Error ? error.message : "Transaction failed");
//       // Track failed transaction
//       const errorMessage = error instanceof Error ? error.message : "Transaction failed";
//     } finally {
//       setIsSending(false);
//     }
//   };

//   return {
//     isSending,
//     sendTransaction,
//     transactionError: error,
//   };
// }

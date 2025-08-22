import { EIP1271_ABI } from "@/abi/eip1271";
import { createPublicClient, http, getAddress, hashTypedData } from "viem";
import { sophonTestnet } from "viem/chains";

// Create a public client for blockchain interactions
const publicClient = createPublicClient({
  chain: sophonTestnet,
  transport: http(),
});

// EIP-1271 magic value that indicates a valid signature
const EIP1271_MAGIC_VALUE = "0x1626ba7e";

export async function validateSignature(
  messageHash: `0x${string}`,
  signature: string,
  expectedAddress: `0x${string}`,
): Promise<boolean> {
  try {
    const normalizedAddress = getAddress(expectedAddress);

    // Check if the address is a smart contract
    const code = await publicClient.getCode({
      address: normalizedAddress,
    });

    if (code && code !== "0x") {
      // It's a smart contract, use publicClient.verifyTypedData for EIP-1271 validation
      return await validateSmartAccountSignature(messageHash, signature, normalizedAddress);
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error validating signature:", error);
    return false;
  }
}

async function validateSmartAccountSignature(
  messageHash: `0x${string}`,
  signature: string,
  contractAddress: string,
): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: EIP1271_ABI,
      functionName: "isValidSignature",
      args: [messageHash, signature as `0x${string}`],
    });

    const isValid = result === EIP1271_MAGIC_VALUE;

    return isValid;
  } catch (error) {
    console.error("Error validating smart account signature:", error);
    return false;
  }
}

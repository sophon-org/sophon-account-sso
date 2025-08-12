import {
	type Address,
	type Chain,
	createPublicClient,
	type Hash,
	hashTypedData,
	http,
} from "viem";

export const verifyEIP1271Signature = async ({
	accountAddress,
	signature,
	domain,
	types,
	primaryType,
	message,
	chain,
}: {
	accountAddress: Address;
	signature: Hash;
	domain: {
		name?: string;
		version?: string;
		chainId?: number | bigint;
		verifyingContract?: Hash;
		salt?: Hash;
	};
	types: Record<string, readonly unknown[]>;
	primaryType: string;
	message: Record<string, unknown>;
	chain: Chain;
}) => {
	try {
		const publicClient = createPublicClient({
			chain,
			transport: http(),
		});

		const messageHash = hashTypedData({
			domain,
			types,
			primaryType,
			message,
		});

		// Call isValidSignature on the SsoAccount contract
		const result = await publicClient.readContract({
			address: accountAddress,
			abi: [
				{
					name: "isValidSignature",
					inputs: [
						{ name: "hash", type: "bytes32" },
						{ name: "signature", type: "bytes" },
					],
					outputs: [{ name: "", type: "bytes4" }],
					stateMutability: "view",
					type: "function",
				},
			],
			functionName: "isValidSignature",
			args: [messageHash, signature],
		});

		// EIP-1271 magic value for valid signature
		const EIP1271_MAGIC_VALUE = "0x1626ba7e";
		const isValid = result === EIP1271_MAGIC_VALUE;
		console.log("🔍 EIP-1271 result:", result);
		console.log("🔍 Is valid signature:", isValid);

		return isValid;
	} catch (error) {
		console.error("❌ EIP-1271 verification failed:", error);
		return false;
	}
};

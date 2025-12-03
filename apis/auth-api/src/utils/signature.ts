import { PinoLogger } from "nestjs-pino";
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
	logger,
	contentsHash,
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
	logger: PinoLogger;
	contentsHash?: string;
}): Promise<boolean> => {
	try {
		const publicClient = createPublicClient({ chain, transport: http() });
		const messageHash =
			contentsHash || hashTypedData({ domain, types, primaryType, message });

		logger.debug({
			evt: "eip1271.hash",
			accountAddress,
			chainId: chain?.id,
			messageHash,
			usedContentsHash: Boolean(contentsHash),
		});

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
			args: [messageHash as `0x${string}`, signature as `0x${string}`],
		});

		const EIP1271_MAGIC_VALUE = "0x1626ba7e";
		const isValid = result === EIP1271_MAGIC_VALUE;

		logger.info({
			evt: "eip1271.result",
			accountAddress,
			chainId: chain?.id,
			result,
			isValid,
		});
		return isValid;
	} catch (err) {
		logger.error({
			evt: "eip1271.error",
			accountAddress,
			chainId: chain?.id,
			err,
		});
		return false;
	}
};

import { sophon, sophonTestnet } from "viem/chains";

/**
 * For now we only support sophon main and testnet. zkOS will be supported only in the future.
 */
export type SupportedChainId = "50104" | "531050104" | 50104 | 531050104;

/**
 * Returns the respective viem chain object for a given chain id.
 *
 * @param id the chain id to map to viem chain object
 * @returns viem chain object
 */
export const getChainById = (id: SupportedChainId) => {
	switch (id) {
		case 50104:
		case "50104":
			return sophon;
		case 531050104:
		case "531050104":
			return sophonTestnet;
		default:
			throw new Error(`Chain with id ${id} not supported.`);
	}
};

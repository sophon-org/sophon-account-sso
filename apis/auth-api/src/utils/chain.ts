import { SophonChains } from "@sophon-labs/account-core";

/**
 * Returns the respective viem chain object for a given chain id.
 *
 * @param id the chain id to map to viem chain object
 * @returns viem chain object
 */
export const getChainById = (id: string | number) => {
	return SophonChains[Number(id)];
};

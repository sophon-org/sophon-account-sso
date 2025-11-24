import { sophonOS, sophonOSTestnet } from "@sophon-labs/account-core";
import { sophon, sophonTestnet } from "viem/chains";

/**
 * Supported chain IDs including old zkSync chains and new EVM-compatible OS chains
 */
export type SupportedChainId =
	| "50104"
	| "531050104"
	| "5010405"
	| "531050204"
	| 50104
	| 531050104
	| 5010405
	| 531050204;

/**
 * Deployment systems available
 */
export enum DeploymentSystem {
	ZKSYNC_SSO = "zksync-sso",
	BICONOMY_NEXUS = "biconomy-nexus",
}

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
		case 5010405:
		case "5010405":
			return sophonOS;
		case 531050204:
		case "531050204":
			return sophonOSTestnet;
		default:
			throw new Error(`Chain with id ${id} not supported.`);
	}
};

/**
 * Returns the deployment system used by the chain
 *
 * @param id the chain id to check
 * @returns deployment system type
 */
export const getDeploymentSystem = (id: SupportedChainId): DeploymentSystem => {
	switch (id) {
		case 50104:
		case "50104":
		case 531050104:
		case "531050104":
			return DeploymentSystem.ZKSYNC_SSO;
		case 5010405:
		case "5010405":
		case 531050204:
		case "531050204":
			return DeploymentSystem.BICONOMY_NEXUS;
		default:
			throw new Error(`Chain with id ${id} not supported.`);
	}
};

/**
 * Checks if chain uses Biconomy Nexus deployment system
 */
export const isBiconomyChain = (id: SupportedChainId): boolean => {
	return getDeploymentSystem(id) === DeploymentSystem.BICONOMY_NEXUS;
};

/**
 * Checks if chain uses zkSync SSO deployment system
 */
export const isZkSyncChain = (id: SupportedChainId): boolean => {
	return getDeploymentSystem(id) === DeploymentSystem.ZKSYNC_SSO;
};

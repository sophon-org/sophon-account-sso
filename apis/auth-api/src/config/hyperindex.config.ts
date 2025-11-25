import { ChainId } from "@sophon-labs/account-core";

type HyperIndexerConfig = {
	graphqlUrl: string;
	timeoutMs: number;
};

export const hyperIndexerByChain: Record<ChainId, HyperIndexerConfig> = {
	50104: {
		graphqlUrl: process.env.HYPERINDEX_API_URL_SOPHON ?? "",
		timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
	},
	531050104: {
		graphqlUrl: process.env.HYPERINDEX_API_URL_SOPHON_TESTNET ?? "",
		timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
	},
	5010405: {
		graphqlUrl: process.env.HYPERINDEX_API_URL_SOPHON_OS ?? "",
		timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
	},
	531050204: {
		graphqlUrl: process.env.HYPERINDEX_API_URL_SOPHON_OS_TESTNET ?? "",
		timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
	},
} as const;

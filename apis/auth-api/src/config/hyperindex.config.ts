import { ChainId } from "@sophon-labs/account-core";

type HyperIndexerConfig = {
	graphqlUrl: string;
	apiKey: string;
	timeoutMs: number;
};

export const hyperIndexerByChain: Record<ChainId, HyperIndexerConfig> = {
	50104: {
		graphqlUrl: "https://indexer.hyperindex.xyz/0789a2f/v1/graphql",
		apiKey: process.env.HYPERINDEX_API_KEY_SOPHON ?? "",
		timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
	},
	531050104: {
		graphqlUrl: "https://indexer.hyperindex.xyz/123abc/v1/graphql",
		apiKey: process.env.HYPERINDEX_API_KEY_SOPHON_TESTNET ?? "",
		timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
	},
	5010405: {
		graphqlUrl: "TBD",
		apiKey: process.env.HYPERINDEX_API_KEY_SOPHON_OS ?? "",
		timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
	},
	531050204: {
		graphqlUrl: "TBD",
		apiKey: process.env.HYPERINDEX_API_KEY_SOPHON_OS_TESTNET ?? "",
		timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
	},
} as const;

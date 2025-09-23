import { registerAs } from "@nestjs/config";

export const hyperindexConfig = registerAs("hyperindex", () => ({
	graphqlUrl:
		process.env.HYPERINDEX_GRAPHQL_URL ??
		"https://indexer.hyperindex.xyz/0789a2f/v1/graphql", // TODO
	apiKey: process.env.HYPERINDEX_API_KEY ?? undefined,
	timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
}));

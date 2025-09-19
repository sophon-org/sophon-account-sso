import { registerAs } from "@nestjs/config";
export const hyperindexConfig = registerAs("hyperindex", () => ({
	graphqlUrl:
		process.env.HYPERINDEX_GRAPHQL_URL ??
		"https://sophon-org-73bd56f.dedicated.hyperindex.xyz/v1/graphql", // TODO
	apiKey: process.env.HYPERINDEX_API_KEY ?? undefined,
	timeoutMs: Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000),
}));

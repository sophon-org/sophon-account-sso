import { Test } from "@nestjs/testing";
import { hyperindexConfig } from "src/config/hyperindex.config";
import { HyperindexService } from "src/hyperindex/hyperindex.service";

const TEST_OWNER = "0xe749b7469a9911e451600cb31b5ca180743183ce";
const EXPECTED_ACCOUNT = "0x53baecdbe5e418cf7c55f7421c3a687e617e21b8";

const url = "https://indexer.hyperindex.xyz/0789a2f/v1/graphql";

const apiKey = process.env.HYPERINDEX_API_KEY ?? "";
const svcTimeoutMs = Number(process.env.HYPERINDEX_TIMEOUT_MS ?? 8000);
const jestTimeoutMs = Number(
	process.env.HYPERINDEX_TEST_TIMEOUT_MS ??
		Math.max(svcTimeoutMs + 3000, 15000),
);

jest.setTimeout(jestTimeoutMs);

describe("HyperindexService (integration)", () => {
	let service: HyperindexService;
	let realFetch: typeof fetch;

	beforeAll(async () => {
		if (!url) throw new Error("Set HYPERINDEX_GRAPHQL_URL");
		if (!apiKey) throw new Error("Set HYPERINDEX_API_KEY");

		console.log("[hyperindex:test] cfg", {
			url,
			hasApiKey: Boolean(apiKey),
			svcTimeoutMs,
			jestTimeoutMs,
		});

		const moduleRef = await Test.createTestingModule({
			providers: [
				HyperindexService,
				{
					provide: hyperindexConfig.KEY,
					useValue: {
						graphqlUrl: url,
						apiKey,
						timeoutMs: svcTimeoutMs,
					},
				},
			],
		}).compile();

		service = moduleRef.get(HyperindexService);

		// Wrap global.fetch to log request/response while using the real fetch underneath
		realFetch = global.fetch;
		const wrappedFetch: typeof fetch = async (
			input: RequestInfo | URL,
			init?: RequestInit,
		): Promise<Response> => {
			const started = Date.now();
			const headers = Object.fromEntries(
				Object.entries((init?.headers as Record<string, string>) ?? {}).map(
					([k, v]) =>
						k.toLowerCase() === "authorization" ? [k, "Bearer ***"] : [k, v],
				),
			);

			let queryPreview: string | undefined;
			try {
				if (typeof init?.body === "string") {
					const parsed = JSON.parse(init.body);
					if (parsed?.query) {
						queryPreview = String(parsed.query)
							.slice(0, 140)
							.replace(/\s+/g, " ");
					}
				}
			} catch {
				// ignore preview parsing errors
			}

			console.log("[hyperindex:fetch] >>>", {
				url: String(input),
				method: init?.method,
				headers,
				hasSignal: Boolean(init?.signal),
				queryPreview,
			});

			try {
				const res = await realFetch(input, init);
				const dur = Date.now() - started;

				let bodySnippet: string | undefined;
				try {
					const txt = await res.clone().text();
					bodySnippet = txt.slice(0, 300);
				} catch {
					// ignore body preview errors
				}

				console.log("[hyperindex:fetch] <<<", {
					status: res.status,
					durationMs: dur,
					bodyPreview: bodySnippet,
				});

				return res;
			} catch (e) {
				const dur = Date.now() - started;

				console.log("[hyperindex:fetch] !!! error", {
					durationMs: dur,
					error: String(e),
				});
				throw e;
			}
		};
		global.fetch = wrappedFetch;
	});

	afterAll(() => {
		if (realFetch) global.fetch = realFetch;
	});

	it(
		"fetches K1OwnerState from the real API",
		async () => {
			console.time("[hyperindex:test] total");

			const rows = await service.getK1OwnerStateByOwner(TEST_OWNER);

			console.log("[hyperindex:test] rows.length =", rows.length);

			if (rows.length === 0) {
				throw new Error("No rows returned for TEST_OWNER");
			}

			const row = rows.find((r) => r.k1Owner?.toLowerCase?.() === TEST_OWNER);

			console.log("[hyperindex:test] row =", row);

			expect(row).toBeDefined();
			expect(row?.accounts.map((a: string) => a.toLowerCase())).toContain(
				EXPECTED_ACCOUNT,
			);

			console.timeEnd("[hyperindex:test] total");
		},
		jestTimeoutMs,
	);
});

import { PartnerRegistryService } from "./partner-registry.service";

describe("PartnerRegistryService", () => {
	const VALID_ID = "123b216c-678e-4611-af9a-2d5b7b061258";
	const CDN = "https://cdn.sophon.xyz/partners/sdk";

	let svc: PartnerRegistryService;
	let originalEnv: NodeJS.ProcessEnv;
	let fetchMock: jest.Mock;

	beforeAll(() => {
		originalEnv = { ...process.env };
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	beforeEach(() => {
		process.env.NODE_ENV = "production";
		process.env.PARTNER_CDN = CDN;

		// Seed all env vars required by getEnv()
		process.env.JWT_KID = process.env.JWT_KID ?? "test-kid";
		process.env.REFRESH_JWT_KID =
			process.env.REFRESH_JWT_KID ?? "test-refresh-kid";

		process.env.PRIVATE_KEY =
			process.env.PRIVATE_KEY ??
			"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n";
		process.env.PUBLIC_KEY =
			process.env.PUBLIC_KEY ??
			"-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n";
		process.env.REFRESH_PRIVATE_KEY =
			process.env.REFRESH_PRIVATE_KEY ??
			"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n";
		process.env.REFRESH_PUBLIC_KEY =
			process.env.REFRESH_PUBLIC_KEY ??
			"-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n";

		process.env.ACCESS_TTL_S = process.env.ACCESS_TTL_S ?? String(60 * 60 * 3); // 3h
		process.env.REFRESH_TTL_S =
			process.env.REFRESH_TTL_S ?? String(60 * 60 * 24 * 90); // 3 months
		process.env.NONCE_TTL_S = process.env.NONCE_TTL_S ?? String(10 * 60); // 10m

		process.env.COOKIE_ACCESS_MAX_AGE_S =
			process.env.COOKIE_ACCESS_MAX_AGE_S ?? String(60 * 60 * 3);
		process.env.COOKIE_REFRESH_MAX_AGE_S =
			process.env.COOKIE_REFRESH_MAX_AGE_S ?? String(60 * 60 * 24 * 90);
		process.env.COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? "localhost";
		process.env.COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE ?? "lax";

		process.env.JWT_ISSUER =
			process.env.JWT_ISSUER ?? "https://auth.example.com";
		process.env.NONCE_ISSUER =
			process.env.NONCE_ISSUER ?? "https://auth.example.com";
		process.env.REFRESH_ISSUER =
			process.env.REFRESH_ISSUER ?? "https://auth.example.com";

		delete process.env.BYPASS_PARTNER_CDN_CHECK;

		fetchMock = jest.fn();
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		(global as any).fetch = fetchMock;

		svc = new PartnerRegistryService();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("returns true when HEAD 200 for a valid partner id", async () => {
		const url = `${CDN}/${VALID_ID}.json`;

		fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

		const ok = await svc.exists(VALID_ID);
		expect(ok).toBe(true);
		expect(fetchMock).toHaveBeenCalledWith(
			url,
			expect.objectContaining({ method: "HEAD" }),
		);
	});

	it("falls back to GET when HEAD 405 and GET 200", async () => {
		const url = `${CDN}/${VALID_ID}.json`;

		// HEAD -> 405 (CDN disallows HEAD), then GET -> 200
		fetchMock
			.mockResolvedValueOnce(new Response(null, { status: 405 })) // HEAD
			.mockResolvedValueOnce(
				new Response("{}", {
					status: 200,
					headers: { "content-type": "application/json" },
				}),
			); // GET

		const ok = await svc.exists(VALID_ID);
		expect(ok).toBe(true);
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			url,
			expect.objectContaining({ method: "HEAD" }),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			url,
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("caches positive result (second call does not hit fetch)", async () => {
		const url = `${CDN}/${VALID_ID}.json`;

		fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 })); // first HEAD -> 200

		const ok1 = await svc.exists(VALID_ID);
		const ok2 = await svc.exists(VALID_ID);

		expect(ok1).toBe(true);
		expect(ok2).toBe(true);

		// Only the first call should have triggered a network request
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			url,
			expect.objectContaining({ method: "HEAD" }),
		);
	});

	it("returns false (and assertExists throws) when not found (404)", async () => {
		const url = `${CDN}/non-existent.json`;

		fetchMock
			.mockResolvedValueOnce(new Response(null, { status: 404 })) // HEAD
			.mockResolvedValueOnce(new Response(null, { status: 404 })); // GET fallback

		const ok = await svc.exists("non-existent");
		await expect(svc.assertExists("non-existent")).rejects.toThrow(
			"Audience not allowed: non-existent",
		);

		expect(ok).toBe(false);
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			url,
			expect.objectContaining({ method: "HEAD" }),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			url,
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("bypasses remote check when NODE_ENV === 'test'", async () => {
		process.env.NODE_ENV = "test"; // trigger bypass
		fetchMock.mockClear();

		const ok = await svc.exists(VALID_ID);
		expect(ok).toBe(true);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

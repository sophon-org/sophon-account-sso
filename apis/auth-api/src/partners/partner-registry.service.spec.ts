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

		// HEAD -> 404 (no fallback needed, but implementation will attempt GET then return false)
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

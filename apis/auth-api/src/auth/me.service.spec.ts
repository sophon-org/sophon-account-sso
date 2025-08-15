import { MeService } from "./me.service";
import type { JwtPayload } from "jsonwebtoken";

describe("MeService", () => {
	const ENV_ID = "de970e83-79d8-40ba-80fb-697bfa73f3ed";
	const API_TOKEN =
		"dyn_JHKOvnmUYtFxqkgOrtv2xnarB0aMj6TwSBqK74UZr0xIsSy8KL1Mf9Hk";
	const USER_ID = "a5b82aff-c255-4f2a-8a36-5e18e1cb02d0";
	const BASE = "https://app.dynamicauth.com";

	const originalEnv = { ...process.env };
	let fetchMock: jest.Mock;

	beforeEach(() => {
		process.env.DYNAMICAUTH_BASE_URL = BASE;
		process.env.DYNAMICAUTH_ENV_ID = ENV_ID;
		process.env.DYNAMICAUTH_API_TOKEN = API_TOKEN;
		delete process.env.DYNAMICAUTH_DEFAULT_USER_ID;

		fetchMock = jest.fn();

		global.fetch = fetchMock;
	});

	afterEach(() => {
		jest.resetAllMocks();
		process.env = { ...originalEnv };
	});

	it("builds /me response using DynamicAuth for a valid user id and granted scope", async () => {
		const dynamicResponse = {
			user: {
				id: USER_ID,
				email: "jsmith@example.com",
				oauthAccounts: [
					{ provider: "discord", accountUsername: "jsmith#1234" },
					{ provider: "twitter", accountUsername: "jsmith" },
				],
				verifiedCredentials: [
					{
						email: "alt@example.com",
						oauth_emails: ["oauth1@example.com", "oauth2@example.com"],
					},
				],
			},
		};

		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => dynamicResponse,
			text: async () => "",
		});

		const payload: JwtPayload & { userId: string; scope: string } = {
			sub: "0xabc",
			aud: "sophon-web",
			iss: "https://auth.example.com",
			iat: 1_700_000_000,
			userId: USER_ID,
			scope: "email discord x",
		};

		const svc = new MeService();

		// Act
		const result = await svc.buildMeResponse(payload);

		// Assert: fetch called with correct URL + headers
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const expectedUrl = `${BASE}/api/v0/environments/${ENV_ID}/users/${USER_ID}`;
		expect(fetchMock).toHaveBeenCalledWith(
			expectedUrl,
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({
					Authorization: `Bearer ${API_TOKEN}`,
					Accept: "application/json",
				}),
			}),
		);

		// Assert: top-level claims
		expect(result.sub).toBe(payload.sub);
		expect(result.aud).toBe(payload.aud);
		expect(result.iss).toBe(payload.iss);
		expect(result.scope).toEqual(["email", "discord", "x"]);

		// Assert: fields resolved based on scope
		expect(result.fields).toEqual(
			expect.objectContaining({
				email: "jsmith@example.com",
				discord: "jsmith#1234",
				x: "jsmith",
			}),
		);
		// And ensure non-granted fields aren't added
		expect((result.fields as any).google).toBeUndefined();
		expect((result.fields as any).telegram).toBeUndefined();
	});
});

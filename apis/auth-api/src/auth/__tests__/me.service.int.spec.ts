import type { JwtPayload } from "jsonwebtoken";
import { MeService } from "../me.service";
import { SecretsService } from "src/aws/secrets.service";

// Gate live integration with an env flag so it won't run in CI accidentally
const RUN_LIVE = process.env.RUN_LIVE_DYNAMICAUTH_TESTS === "1";
const itLive = RUN_LIVE ? it : it.skip;
const describeLive = RUN_LIVE ? describe : describe.skip;

describeLive("MeService (integration with DynamicAuth)", () => {
	const ENV_ID =
		process.env.DYNAMICAUTH_ENV_ID ?? "de970e83-79d8-40ba-80fb-697bfa73f3ed";
	const API_TOKEN =
		process.env.DYNAMICAUTH_API_TOKEN ??
		"dyn_JHKOvnmUYtFxqkgOrtv2xnarB0aMj6TwSBqK74UZr0xIsSy8KL1Mf9Hk";
	const BASE =
		process.env.DYNAMICAUTH_BASE_URL ?? "https://app.dynamicauth.com";
	const USER_ID =
		process.env.DYNAMICAUTH_TEST_USER_ID ??
		"a5b82aff-c255-4f2a-8a36-5e18e1cb02d0"; // <- your provided example

	const originalEnv = { ...process.env };

	beforeAll(() => {
		process.env.DYNAMICAUTH_ENV_ID = ENV_ID;
		process.env.DYNAMICAUTH_API_TOKEN = API_TOKEN;
		process.env.DYNAMICAUTH_BASE_URL = BASE;

		jest.setTimeout(15000);
	});

	afterAll(() => {
		process.env = { ...originalEnv };
	});

	itLive("fetches user and returns scoped fields", async () => {
		const secretsMock: Partial<SecretsService> = {
			loadJwtSecrets: jest.fn().mockResolvedValue({ dynamicToken: API_TOKEN }),
		};
		const svc = new MeService(secretsMock as SecretsService);

		const payload: JwtPayload & { userId: string; scope: string } = {
			sub: "0xabc",
			aud: "sophon-web",
			iss: "https://auth.example.com",
			iat: Math.floor(Date.now() / 1000),
			userId: USER_ID,
			scope: "email discord x",
		};

		const res = await svc.buildMeResponse(payload);

		// Basic claims echoed through
		expect(res.sub).toBe(payload.sub);
		expect(res.aud).toBe(payload.aud);
		expect(res.iss).toBe(payload.iss);

		expect(res.scope).toEqual(["email", "discord", "x"]);

		expect(Object.keys(res.fields)).toEqual(
			expect.arrayContaining(["email", "discord", "x"]),
		);

		expect(
			["string", "object", "undefined"].includes(typeof res.fields.email),
		).toBe(true);
	});

	itLive("fails with a bad API token", async () => {
		const badToken = "dyn_invalid_token_for_test";
		process.env.DYNAMICAUTH_API_TOKEN = badToken;

		const secretsMock: Partial<SecretsService> = {
			loadJwtSecrets: jest.fn().mockResolvedValue({ dynamicToken: API_TOKEN }),
		};
		const svc = new MeService(secretsMock as SecretsService);
		const payload: JwtPayload & { userId: string; scope: string } = {
			sub: "0xabc",
			aud: "sophon-web",
			iss: "https://auth.example.com",
			userId: USER_ID,
			scope: "email",
		};

		await expect(svc.buildMeResponse(payload)).rejects.toThrow(
			/DynamicAuth request failed|timed out/i,
		);
	});
});

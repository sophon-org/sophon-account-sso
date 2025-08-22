import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import type { TypedDataDefinition } from "viem";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { AuthService } from "./auth.service";

// --- jsonwebtoken mocks ---
jest.mock("jsonwebtoken", () => ({
	sign: jest.fn(),
	verify: jest.fn(),
}));

// --- signature verifier mock ---
jest.mock("../utils/signature", () => ({
	verifyEIP1271Signature: jest.fn().mockResolvedValue(true),
}));

// --- key/env mocks ---
jest.mock("../utils/jwt", () => ({
	getPrivateKey: jest.fn().mockResolvedValue("PRIVATE_KEY"),
	getPublicKey: jest.fn().mockResolvedValue("PUBLIC_KEY"),
	getRefreshPrivateKey: jest.fn().mockResolvedValue("REFRESH_PRIVATE_KEY"),
	getRefreshPublicKey: jest.fn().mockResolvedValue("REFRESH_PUBLIC_KEY"),
}));

jest.mock("../config/env", () => {
	const env = {
		ACCESS_TTL_S: 60 * 60 * 3, // 3h
		REFRESH_TTL_S: 60 * 60 * 24 * 30, // 3h
		NONCE_TTL_S: 600, // 3h
		COOKIE_ACCESS_MAX_AGE_S: 60 * 60 * 3,
		COOKIE_REFRESH_MAX_AGE_S: 60 * 60 * 24 * 30,
		COOKIE_DOMAIN: "localhost",
		COOKIE_SAME_SITE: "lax",
		JWT_ISSUER: "https://auth.example.com",
		NONCE_ISSUER: "https://auth.example.com",
		REFRESH_ISSUER: "https://auth.example.com",
		REFRESH_JWT_KID: "test-refresh-kid",
	};
	return {
		getJwtKid: jest.fn().mockReturnValue("test-kid"),
		JWT_ISSUER: env.JWT_ISSUER,
		getEnv: jest.fn().mockReturnValue(env),
	};
});

describe("AuthService (new token features)", () => {
	let service: AuthService;
	const partnerRegistryMock = {
		assertExists: jest.fn().mockResolvedValue(undefined),
		exists: jest.fn().mockResolvedValue(true),
	};

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: PartnerRegistryService, useValue: partnerRegistryMock },
			],
		}).compile();

		service = module.get(AuthService);
		jest.clearAllMocks();
	});

	it("verifySignatureWithSiweIssueTokens: returns access + refresh + sid, signs twice", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			nonce: "expected-nonce",
			address: "0xabc0000000000000000000000000000000000001",
			aud: "sophon-web",
			iss: "https://auth.example.com",
			scope: "email x",
		});

		(jwt.sign as jest.Mock)
			.mockReturnValueOnce("mocked.access")
			.mockReturnValueOnce("mocked.refresh");

		const typedData: TypedDataDefinition = {
			domain: { name: "Sophon SSO", version: "1", chainId: 300 },
			types: {},
			primaryType: "Login",
			message: {
				from: "0xabc0000000000000000000000000000000000001",
				nonce: "expected-nonce",
				audience: "sophon-web",
			},
		};

		const result = await service.verifySignatureWithSiweIssueTokens(
			"0xabc0000000000000000000000000000000000001",
			typedData,
			"0xsignature",
			"expected-nonce",
		);

		expect(result).toEqual({
			accessToken: "mocked.access",
			refreshToken: "mocked.refresh",
			sid: expect.any(String),
		});

		// first sign call: access token
		expect((jwt.sign as jest.Mock).mock.calls[0][0]).toEqual(
			expect.objectContaining({
				typ: "access",
				sid: expect.any(String),
				scope: "email x",
			}),
		);
		expect((jwt.sign as jest.Mock).mock.calls[0][1]).toBe("PRIVATE_KEY");
		expect((jwt.sign as jest.Mock).mock.calls[0][2]).toEqual(
			expect.objectContaining({
				algorithm: "RS256",
				keyid: "test-kid",
				issuer: "https://auth.example.com",
				audience: "sophon-web",
				expiresIn: 60 * 60 * 3,
			}),
		);

		// second sign call: refresh token
		expect((jwt.sign as jest.Mock).mock.calls[1][0]).toEqual(
			expect.objectContaining({
				typ: "refresh",
				jti: expect.any(String),
				sid: expect.any(String),
				scope: "email x",
			}),
		);
		expect((jwt.sign as jest.Mock).mock.calls[1][1]).toBe(
			"REFRESH_PRIVATE_KEY",
		);
		expect((jwt.sign as jest.Mock).mock.calls[1][2]).toEqual(
			expect.objectContaining({
				algorithm: "RS256",
				keyid: "test-refresh-kid",
				issuer: "https://auth.example.com",
				audience: "sophon-web",
				expiresIn: 60 * 60 * 24 * 30,
			}),
		);
	});

	it("refresh: verifies refresh token and rotates both tokens", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			sub: "0xabc0000000000000000000000000000000000001",
			aud: "sophon-web",
			scope: "email x",
			userId: "u123",
			sid: "session-1",
		});

		(jwt.sign as jest.Mock)
			.mockReturnValueOnce("rotated.access")
			.mockReturnValueOnce("rotated.refresh");

		const { accessToken, refreshToken } = await service.refresh(
			"dummy.refresh.token",
		);

		expect(jwt.verify).toHaveBeenCalledWith(
			"dummy.refresh.token",
			"REFRESH_PUBLIC_KEY",
			expect.objectContaining({
				algorithms: ["RS256"],
				issuer: "https://auth.example.com",
			}),
		);

		// new access token
		expect((jwt.sign as jest.Mock).mock.calls[0][0]).toEqual(
			expect.objectContaining({
				typ: "access",
				sub: "0xabc0000000000000000000000000000000000001",
				sid: "session-1",
				scope: "email x",
				userId: "u123",
			}),
		);
		expect((jwt.sign as jest.Mock).mock.calls[0][1]).toBe("PRIVATE_KEY");
		expect((jwt.sign as jest.Mock).mock.calls[0][2]).toEqual(
			expect.objectContaining({
				issuer: "https://auth.example.com",
				audience: "sophon-web",
				expiresIn: 60 * 60 * 3,
			}),
		);

		expect((jwt.sign as jest.Mock).mock.calls[1][0]).toEqual(
			expect.objectContaining({
				typ: "refresh",
				sub: "0xabc0000000000000000000000000000000000001",
				sid: "session-1",
				scope: "email x",
				userId: "u123",
				jti: expect.any(String),
			}),
		);
		expect((jwt.sign as jest.Mock).mock.calls[1][1]).toBe(
			"REFRESH_PRIVATE_KEY",
		);
		expect((jwt.sign as jest.Mock).mock.calls[1][2]).toEqual(
			expect.objectContaining({
				issuer: "https://auth.example.com",
				audience: "sophon-web",
				expiresIn: 60 * 60 * 24 * 30,
			}),
		);

		expect(accessToken).toBe("rotated.access");
		expect(refreshToken).toBe("rotated.refresh");
	});
});

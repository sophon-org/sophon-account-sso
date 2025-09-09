import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import { TypedDataDefinition } from "viem";
import { PartnerRegistryService } from "../../partners/partner-registry.service";
import { SessionsRepository } from "../../sessions/sessions.repository";
import { AuthService } from "../auth.service";

// --- jsonwebtoken mocks ---
jest.mock("jsonwebtoken", () => ({
	sign: jest.fn().mockReturnValue("mocked.token"),
	verify: jest.fn(),
}));

// --- signature verifier mock ---
jest.mock("../../utils/signature", () => ({
	verifyEIP1271Signature: jest.fn().mockResolvedValue(true),
}));

// --- key/env mocks ---
jest.mock("../../utils/jwt", () => ({
	getPrivateKey: jest.fn().mockResolvedValue("PRIVATE_KEY"),
	getPublicKey: jest.fn().mockResolvedValue("PUBLIC_KEY"),
}));

jest.mock("../../config/env", () => {
	const env = {
		ACCESS_TTL_S: 60 * 60 * 3,
		REFRESH_TTL_S: 60 * 60 * 24 * 30,
		NONCE_TTL_S: 600,
		COOKIE_ACCESS_MAX_AGE_S: 60 * 60 * 3,
		COOKIE_REFRESH_MAX_AGE_S: 60 * 60 * 24 * 30,
		JWT_ISSUER: "https://auth.example.com",
		NONCE_ISSUER: "https://auth.example.com",
		REFRESH_ISSUER: "https://auth.example.com",
		COOKIE_DOMAIN: "localhost",
		REFRESH_JWT_KID: "test-refresh-kid",
		COOKIE_SAME_SITE: "lax",
	};
	return {
		getJwtKid: jest.fn().mockReturnValue("test-kid"),
		JWT_ISSUER: env.JWT_ISSUER,
		JWT_AUDIENCE: "example-client",
		ALLOWED_AUDIENCES: ["sophon-web", "sophon-admin", "partner-x"],
		getEnv: jest.fn().mockReturnValue(env),
	};
});

describe("AuthService", () => {
	let service: AuthService;
	const partnerRegistryMock = {
		assertExists: jest.fn().mockResolvedValue(undefined),
		exists: jest.fn().mockResolvedValue(true),
	};

	const sessionsRepositoryMock = {
		create: jest.fn(),
		getBySid: jest.fn(),
		isActive: jest.fn(),
		revokeSid: jest.fn(),
		rotateRefreshJti: jest.fn(),
	};

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: PartnerRegistryService, useValue: partnerRegistryMock },
				{ provide: SessionsRepository, useValue: sessionsRepositoryMock },
			],
		}).compile();

		service = module.get(AuthService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	it("should generate a nonce token (stores fields in scope)", async () => {
		const token = await service.generateNonceTokenForAddress(
			"0x1234567890abcdef1234567890abcdef12345678",
			"sophon-web",
			["email", "x"],
		);

		expect(token).toBe("mocked.token");
		expect(jwt.sign).toHaveBeenCalledWith(
			expect.objectContaining({
				nonce: expect.any(String),
				address: "0x1234567890abcdef1234567890abcdef12345678",
				scope: "email x",
			}),
			"PRIVATE_KEY",
			expect.objectContaining({
				algorithm: "RS256",
				keyid: "test-kid",
				issuer: "https://auth.example.com",
				audience: "sophon-web",
				subject: "0x1234567890abcdef1234567890abcdef12345678",
				expiresIn: 600, // NONCE_TTL_S default
			}),
		);
	});

	it("should verify signature and return JWT", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			nonce: "expected-nonce",
			address: "0x1234567890abcdef1234567890abcdef12345678",
			aud: "sophon-web",
			iss: process.env.NONCE_ISSUER,
			scope: "email x",
		});

		const typedData: TypedDataDefinition = {
			domain: { name: "Sophon SSO", version: "1", chainId: 300 },
			types: {},
			primaryType: "Login",
			message: {
				from: "0x1234567890abcdef1234567890abcdef12345678",
				nonce: "expected-nonce",
				audience: "sophon-web",
			},
		};

		const token = await service.verifySignatureWithSiwe(
			"0x1234567890abcdef1234567890abcdef12345678",
			typedData,
			"0xsignature",
			"expected-nonce",
		);

		expect(token).toBe("mocked.token");
	});

	it("should throw on nonce mismatch", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			nonce: "anything-here",
			address: "0x1234567890abcdef1234567890abcdef12345678",
			aud: "sophon-web",
			iss: process.env.NONCE_ISSUER,
			scope: "email x",
		});

		const typedData: TypedDataDefinition = {
			domain: { name: "Sophon SSO", version: "1", chainId: 300 },
			types: {},
			primaryType: "Login",
			message: {
				from: "0x1234567890abcdef1234567890abcdef12345678",
				nonce: "DIFFERENT-NONCE",
				audience: "sophon-web",
			},
		};

		await expect(() =>
			service.verifySignatureWithSiwe(
				"0x1234567890abcdef1234567890abcdef12345678",
				typedData,
				"0xsignature",
				"mocked-nonce-token",
			),
		).rejects.toThrow(/nonce or address mismatch/i);
	});

	it("should return correct cookie options for access token", () => {
		const options = service.cookieOptions();
		expect(options).toMatchObject({
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			maxAge: 60 * 60 * 3 * 1000,
			domain: "localhost",
		});
	});

	it("should return correct cookie options for refresh token", () => {
		const options = service.refreshCookieOptions();
		expect(options.maxAge).toBe(60 * 60 * 24 * 30 * 1000);
	});
});

import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import { LoggerModule } from "nestjs-pino";
import type { TypedDataDefinition } from "viem";
import { JwtKeysService } from "../../aws/jwt-keys.service";
import { authConfig } from "../../config/auth.config";
import { PartnerRegistryService } from "../../partners/partner-registry.service";
import { SessionsRepository } from "../../sessions/sessions.repository";
import { AuthService } from "../auth.service";
import { ConsentsService } from "../../consents/consents.service";

const loggerModule = LoggerModule.forRoot({ pinoHttp: { enabled: false } });

// --- jsonwebtoken mocks ---
jest.mock("jsonwebtoken", () => ({
	sign: jest.fn().mockReturnValue("mocked.token"),
	verify: jest.fn(),
	decode: jest.fn(),
}));

// --- signature verifier mock ---
jest.mock("../../utils/signature", () => ({
	verifyEIP1271Signature: jest.fn().mockResolvedValue(true),
}));

const MOCK_AUTH = {
	accessTtlS: 60 * 60 * 3,
	refreshTtlS: 60 * 60 * 24 * 30,
	nonceTtlS: 600,

	jwtKid: "test-kid",
	jwtIssuer: "https://auth.example.com",
	nonceIssuer: "https://auth.example.com",
	refreshIssuer: "https://auth.example.com",
	refreshJwtKid: "test-refresh-kid",

	cookieDomain: "localhost",
	cookieAccessMaxAgeS: 60 * 60 * 3,
	cookieRefreshMaxAgeS: 60 * 60 * 24 * 30,

	jwtAudience: "example-client",
	partnerCdn: "https://cdn.sophon.xyz/partners/sdk",
} as const;

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

	type JwtKeysServiceMock = {
		getAccessPrivateKey: jest.Mock<Promise<string>, []>;
		getAccessPublicKey: jest.Mock<Promise<string>, []>;
		getRefreshPrivateKey: jest.Mock<Promise<string>, []>;
		getRefreshPublicKey: jest.Mock<Promise<string>, []>;
		getAccessKid: jest.Mock<Promise<string>, []>;
		getRefreshKid: jest.Mock<Promise<string>, []>;
	};

	const jwtKeysServiceMock: JwtKeysServiceMock = {
		getAccessPrivateKey: jest.fn().mockResolvedValue("PRIVATE_KEY"),
		getAccessPublicKey: jest.fn().mockResolvedValue("PUBLIC_KEY"),
		getRefreshPrivateKey: jest.fn().mockResolvedValue("R_PRIVATE_KEY"),
		getRefreshPublicKey: jest.fn().mockResolvedValue("R_PUBLIC_KEY"),
		getAccessKid: jest.fn().mockResolvedValue("test-kid"),
		getRefreshKid: jest.fn().mockResolvedValue("test-refresh-kid"),
	};
	const consentsServiceMock = {
		assertPartnerScopeAllowed: jest.fn(), // no throw = allowed
		areFieldsAllowedByConsent: jest.fn().mockReturnValue(true),
		upsertGeneralConsent: jest.fn().mockResolvedValue(undefined),
		getGeneralConsent: jest.fn().mockResolvedValue({
			personalizationAds: true,
			sharingData: true,
			updatedAt: new Date().toISOString(),
		}),
		getActiveConsents: jest.fn().mockResolvedValue([]),
	};

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			imports: [ConfigModule.forFeature(authConfig), loggerModule],
			providers: [
				AuthService,
				{ provide: PartnerRegistryService, useValue: partnerRegistryMock },
				{ provide: SessionsRepository, useValue: sessionsRepositoryMock },
				{ provide: JwtKeysService, useValue: jwtKeysServiceMock },
				{ provide: ConsentsService, useValue: consentsServiceMock },
			],
		})
			.overrideProvider(authConfig.KEY)
			.useValue(MOCK_AUTH)
			.compile();

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
				expiresIn: 600,
			}),
		);
	});

	it("should verify signature and issue tokens", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			nonce: "expected-nonce",
			address: "0x1234567890abcdef1234567890abcdef12345678",
			aud: "sophon-web",
			iss: MOCK_AUTH.nonceIssuer,
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

		const tokens = await service.verifySignatureWithSiweIssueTokens(
			"0x1234567890abcdef1234567890abcdef12345678",
			typedData,
			"0xsignature",
			"expected-nonce",
		);

		expect(tokens).toMatchObject({
			accessToken: "mocked.token",
			refreshToken: "mocked.token",
		});
		expect(tokens).toHaveProperty("sid");

		expect(tokens).toHaveProperty("accessTokenExpiresAt");
		expect(tokens).toHaveProperty("refreshTokenExpiresAt");
	});

	it("should throw on nonce mismatch", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			nonce: "anything-here",
			address: "0x1234567890abcdef1234567890abcdef12345678",
			aud: "sophon-web",
			iss: MOCK_AUTH.nonceIssuer,
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
			service.verifySignatureWithSiweIssueTokens(
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

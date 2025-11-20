import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import { LoggerModule } from "nestjs-pino";
import { ConsentsService } from "src/consents/consents.service";
import type { TypedDataDefinition } from "viem";
import { JwtKeysService } from "../../aws/jwt-keys.service";
import { authConfig } from "../../config/auth.config";
import { PartnerRegistryService } from "../../partners/partner-registry.service";
import { SessionsRepository } from "../../sessions/sessions.repository";
import { AuthService } from "../auth.service";

const loggerModule = LoggerModule.forRoot({ pinoHttp: { enabled: false } });
// --- jsonwebtoken mocks ---
jest.mock("jsonwebtoken", () => ({
	sign: jest.fn(),
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
	cookieAccessMaxAgeS: 60 * 60 * 3,
	cookieRefreshMaxAgeS: 60 * 60 * 24 * 30,
	cookieDomain: "localhost",
	jwtIssuer: "https://auth.example.com",
	nonceIssuer: "https://auth.example.com",
	refreshIssuer: "https://auth.example.com",
	refreshJwtKid: "test-refresh-kid",
	jwtKid: "test-kid",
	jwtAudience: "sophon-web",
	partnerCdn: "https://cdn.sophon.xyz/partners/sdk",
} as const;

describe("AuthService (new token features)", () => {
	let service: AuthService;

	const partnerRegistryMock = {
		assertExists: jest.fn().mockResolvedValue(undefined),
		exists: jest.fn().mockResolvedValue(true),
	};

	const sessionsRepositoryMock = {
		create: jest.fn().mockResolvedValue(undefined),
		getBySid: jest.fn(),
		isActive: jest.fn(),
		revokeSid: jest.fn().mockResolvedValue(undefined),
		rotateRefreshJti: jest.fn().mockResolvedValue(undefined),
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
		getAccessPrivateKey: jest
			.fn<Promise<string>, []>()
			.mockResolvedValue("PRIVATE_KEY"),
		getAccessPublicKey: jest
			.fn<Promise<string>, []>()
			.mockResolvedValue("PUBLIC_KEY"),
		getRefreshPrivateKey: jest
			.fn<Promise<string>, []>()
			.mockResolvedValue("REFRESH_PRIVATE_KEY"),
		getRefreshPublicKey: jest
			.fn<Promise<string>, []>()
			.mockResolvedValue("REFRESH_PUBLIC_KEY"),
		getAccessKid: jest.fn<Promise<string>, []>().mockResolvedValue("test-kid"),
		getRefreshKid: jest
			.fn<Promise<string>, []>()
			.mockResolvedValue("test-refresh-kid"),
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
			imports: [
				ConfigModule.forRoot({ isGlobal: false, load: [authConfig] }),
				loggerModule,
			],
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

	it("verifySignatureWithSiweIssueTokens: returns access + refresh + sid and creates a session", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			nonce: "expected-nonce",
			address: "0xabc0000000000000000000000000000000000001",
			aud: "sophon-web",
			iss: "https://auth.example.com",
			scope: "email x",
			userId: "u1",
		});

		(jwt.sign as jest.Mock)
			.mockReturnValueOnce("mocked.access")
			.mockReturnValueOnce("mocked.refresh");

		const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
		(jwt.decode as jest.Mock).mockReturnValue({ exp });

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
			300,
		);

		expect(result).toEqual({
			accessToken: "mocked.access",
			refreshToken: "mocked.refresh",
			accessTokenExpiresAt: expect.any(Number),
			refreshTokenExpiresAt: expect.any(Number),
			sid: expect.any(String),
		});

		const accessPayload = (jwt.sign as jest.Mock).mock.calls[0][0];
		expect(accessPayload).toEqual(
			expect.objectContaining({
				typ: "access",
				sid: expect.any(String),
				scope: "email x",
				userId: "u1",
				sub: "0xabc0000000000000000000000000000000000001",
				chainId: 300,
			}),
		);
		expect((jwt.sign as jest.Mock).mock.calls[0][1]).toBe("PRIVATE_KEY");
		expect((jwt.sign as jest.Mock).mock.calls[0][2]).toEqual(
			expect.objectContaining({
				algorithm: "RS256",
				keyid: MOCK_AUTH.jwtKid,
				issuer: "https://auth.example.com",
				audience: "sophon-web",
				expiresIn: 60 * 60 * 3,
			}),
		);

		const refreshPayload = (jwt.sign as jest.Mock).mock.calls[1][0];
		expect(refreshPayload).toEqual(
			expect.objectContaining({
				typ: "refresh",
				jti: expect.any(String),
				sid: accessPayload.sid,
				scope: "email x",
				userId: "u1",
				chainId: 300,
			}),
		);
		expect((jwt.sign as jest.Mock).mock.calls[1][1]).toBe(
			"REFRESH_PRIVATE_KEY",
		);
		expect((jwt.sign as jest.Mock).mock.calls[1][2]).toEqual(
			expect.objectContaining({
				algorithm: "RS256",
				keyid: MOCK_AUTH.refreshJwtKid,
				issuer: "https://auth.example.com",
				audience: "sophon-web",
				expiresIn: 60 * 60 * 24 * 30,
			}),
		);
		expect(sessionsRepositoryMock.create).toHaveBeenCalledWith(
			expect.objectContaining({
				sid: accessPayload.sid,
				userId: "u1",
				aud: "sophon-web",
				currentRefreshJti: refreshPayload.jti,
				refreshExpiresAt: expect.any(Date),
				chainId: 300,
			}),
		);
	});

	it("refresh: verifies refresh token, checks session, rotates refresh jti, returns new tokens", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			typ: "refresh",
			sub: "0xabc0000000000000000000000000000000000001",
			aud: "sophon-web",
			scope: "email x",
			userId: "u123",
			sid: "session-1",
			jti: "jti-old",
			chainId: 300,
		});

		sessionsRepositoryMock.getBySid.mockResolvedValueOnce({
			sid: "session-1",
			currentRefreshJti: "jti-old",
			revokedAt: null,
			refreshExpiresAt: new Date(Date.now() + 60_000),
			invalidatedBefore: null,
			chainId: 300,
		});
		sessionsRepositoryMock.isActive.mockReturnValue(true);

		(jwt.sign as jest.Mock)
			.mockReturnValueOnce("rotated.access")
			.mockReturnValueOnce("rotated.refresh");

		const newExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
		(jwt.decode as jest.Mock).mockReturnValue({ exp: newExp });

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

		const accessPayload = (jwt.sign as jest.Mock).mock.calls[0][0];
		expect(accessPayload).toEqual(
			expect.objectContaining({
				typ: "access",
				sub: "0xabc0000000000000000000000000000000000001",
				sid: "session-1",
				scope: "email x",
				userId: "u123",
				chainId: 300,
			}),
		);

		const newRefreshPayload = (jwt.sign as jest.Mock).mock.calls[1][0];
		expect(newRefreshPayload).toEqual(
			expect.objectContaining({
				typ: "refresh",
				sub: "0xabc0000000000000000000000000000000000001",
				sid: "session-1",
				scope: "email x",
				userId: "u123",
				jti: expect.any(String),
				chainId: 300,
			}),
		);

		expect(sessionsRepositoryMock.rotateRefreshJti).toHaveBeenCalledWith(
			expect.objectContaining({
				sid: "session-1",
				newJti: newRefreshPayload.jti,
				newRefreshExpiresAt: expect.any(Date),
			}),
		);

		expect(accessToken).toBe("rotated.access");
		expect(refreshToken).toBe("rotated.refresh");
	});
});

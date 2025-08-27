import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import type { TypedDataDefinition } from "viem";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { AuthService } from "./auth.service";
import { SessionsRepository } from "../sessions/sessions.repository";

// --- jsonwebtoken mocks ---
jest.mock("jsonwebtoken", () => ({
	sign: jest.fn(),
	verify: jest.fn(),
	decode: jest.fn(),
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
		REFRESH_TTL_S: 60 * 60 * 24 * 30, // 30d
		NONCE_TTL_S: 600, // 10m
		COOKIE_ACCESS_MAX_AGE_S: 60 * 60 * 3,
		COOKIE_REFRESH_MAX_AGE_S: 60 * 60 * 24 * 30,
		COOKIE_DOMAIN: "localhost",
		JWT_ISSUER: "https://auth.example.com",
		NONCE_ISSUER: "https://auth.example.com",
		REFRESH_ISSUER: "https://auth.example.com",
		REFRESH_JWT_KID: "test-refresh-kid",
		JWT_KID: "test-kid",
		JWT_AUDIENCE: "sophon-web",
		PARTNER_CDN: "https://cdn.sophon.xyz/partners/sdk",
	};
	return {
		getJwtKid: jest.fn().mockReturnValue("test-kid"),
		getEnv: jest.fn().mockReturnValue(env),
	};
});

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
		);

		expect(result).toEqual({
			accessToken: "mocked.access",
			refreshToken: "mocked.refresh",
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

		const refreshPayload = (jwt.sign as jest.Mock).mock.calls[1][0];
		expect(refreshPayload).toEqual(
			expect.objectContaining({
				typ: "refresh",
				jti: expect.any(String),
				sid: accessPayload.sid,
				scope: "email x",
				userId: "u1",
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
		expect(sessionsRepositoryMock.create).toHaveBeenCalledWith(
			expect.objectContaining({
				sid: accessPayload.sid,
				userId: "u1",
				aud: "sophon-web",
				currentRefreshJti: refreshPayload.jti,
				refreshExpiresAt: expect.any(Date),
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
		});

		sessionsRepositoryMock.getBySid.mockResolvedValueOnce({
			sid: "session-1",
			current_refresh_jti: "jti-old",
			revoked_at: null,
			refresh_expires_at: new Date(Date.now() + 60_000),
			invalidate_before: null,
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

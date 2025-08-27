import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import { UnauthorizedException } from "@nestjs/common";
import type { TypedDataDefinition } from "viem";
import { AuthService } from "./auth.service";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { SessionsRepository } from "../sessions/sessions.repository";

// ---- Mocks ----

// jsonwebtoken
jest.mock("jsonwebtoken", () => ({
	sign: jest.fn(),
	verify: jest.fn(),
	decode: jest.fn(),
}));

// EIP-1271 verifier
jest.mock("../utils/signature", () => ({
	verifyEIP1271Signature: jest.fn().mockResolvedValue(true),
}));

// keys
jest.mock("../utils/jwt", () => ({
	getPrivateKey: jest.fn().mockResolvedValue("PRIV"),
	getPublicKey: jest.fn().mockResolvedValue("PUB"),
	getRefreshPrivateKey: jest.fn().mockResolvedValue("RPRIV"),
	getRefreshPublicKey: jest.fn().mockResolvedValue("RPUB"),
}));

// env
const MOCK_ENV = {
	ACCESS_TTL_S: 60 * 60 * 3, // 3h
	REFRESH_TTL_S: 60 * 60 * 24 * 90, // 90d
	NONCE_TTL_S: 600, // 10m
	COOKIE_ACCESS_MAX_AGE_S: 60 * 60 * 3,
	COOKIE_REFRESH_MAX_AGE_S: 60 * 60 * 24 * 90,

	JWT_KID: "test-kid",
	JWT_ISSUER: "https://auth.example.com",
	NONCE_ISSUER: "https://auth.example.com/nonce",
	REFRESH_ISSUER: "https://auth.example.com/refresh",
	REFRESH_JWT_KID: "refresh-kid",

	COOKIE_DOMAIN: "localhost",
	JWT_AUDIENCE: "example-client",
	PARTNER_CDN: "https://cdn.sophon.xyz/partners/sdk",
};
jest.mock("../config/env", () => ({
	getEnv: jest.fn(() => MOCK_ENV),
	getJwtKid: jest.fn(() => MOCK_ENV.JWT_KID),
}));

describe("AuthService (sessions + refresh)", () => {
	let service: AuthService;

	// partner registry mock
	const partnerRegistryMock: jest.Mocked<PartnerRegistryService> = {
		assertExists: jest.fn().mockResolvedValue(undefined),
		exists: jest.fn().mockResolvedValue(true),
	} as unknown as jest.Mocked<PartnerRegistryService>;

	// sessions repo mock
	type SessionRow = {
		current_refresh_jti: string | null;
		refresh_expires_at: Date | null;
		revoked_at: Date | null;
		invalidate_before: Date | null;
	};
	const sessionsMock: {
		create: jest.Mock<Promise<void>, [unknown]>;
		getBySid: jest.Mock<Promise<SessionRow | null>, [string]>;
		isActive: jest.Mock<boolean, [SessionRow | null]>;
		rotateRefreshJti: jest.Mock<Promise<void>, [unknown]>;
		revokeSid: jest.Mock<Promise<void>, [string]>;
	} = {
		create: jest.fn(),
		getBySid: jest.fn(),
		isActive: jest.fn(),
		rotateRefreshJti: jest.fn(),
		revokeSid: jest.fn(),
	};

	const FIXED_NOW_MS = 1_700_000_000_000; // fixed now for deterministic tests
	let dateNowSpy: jest.SpyInstance<number, []>;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: PartnerRegistryService, useValue: partnerRegistryMock },
				{ provide: SessionsRepository, useValue: sessionsMock },
			],
		}).compile();

		service = module.get(AuthService);

		jest.clearAllMocks();
		dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW_MS);
	});

	afterEach(() => {
		dateNowSpy.mockRestore();
	});

	it("verifySignatureWithSiweIssueTokens: issues tokens, persists session with jti & exp", async () => {
		// nonce token verify result
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			nonce: "nonce.jwt",
			address: "0x1234567890abcdef1234567890abcdef12345678",
			aud: "sophon-web",
			iss: MOCK_ENV.NONCE_ISSUER,
			scope: "email x",
			userId: "u1",
		});

		// access + refresh token signatures
		(jwt.sign as jest.Mock)
			.mockImplementationOnce(() => "access.jwt") // access
			.mockImplementationOnce(() => "refresh.jwt"); // refresh

		// decode refresh for exp -> session.refresh_expires_at
		const expSecs = Math.floor(FIXED_NOW_MS / 1000) + MOCK_ENV.REFRESH_TTL_S;
		(jwt.decode as jest.Mock).mockReturnValue({ exp: expSecs });

		const typedData: TypedDataDefinition = {
			domain: { name: "Sophon SSO", version: "1", chainId: 300 },
			types: {},
			primaryType: "Login",
			message: {
				from: "0x1234567890abcdef1234567890abcdef12345678",
				nonce: "nonce.jwt",
				audience: "sophon-web",
			},
		};

		sessionsMock.create.mockResolvedValue(undefined);

		const { accessToken, refreshToken, sid } =
			await service.verifySignatureWithSiweIssueTokens(
				"0x1234567890abcdef1234567890abcdef12345678",
				typedData,
				"0xsignature",
				"nonce.jwt",
			);

		// returns
		expect(accessToken).toBe("access.jwt");
		expect(refreshToken).toBe("refresh.jwt");
		expect(typeof sid).toBe("string");

		// ensure both tokens were signed with correct shapes (typ/sid/jti)
		const signCalls = (jwt.sign as jest.Mock).mock.calls;
		expect(signCalls.length).toBe(2);

		const accessPayload = signCalls[0][0] as {
			typ?: string;
			sid?: string;
			userId?: string;
			scope?: string;
		};
		const refreshPayload = signCalls[1][0] as {
			typ?: string;
			sid?: string;
			jti?: string;
			userId?: string;
			scope?: string;
		};

		expect(accessPayload.typ).toBe("access");
		expect(typeof accessPayload.sid).toBe("string");
		expect(refreshPayload.typ).toBe("refresh");
		expect(refreshPayload.sid).toBe(accessPayload.sid);
		expect(typeof refreshPayload.jti).toBe("string");

		// sessions.create called with the refresh jti & computed expiration
		expect(sessionsMock.create).toHaveBeenCalledWith(
			expect.objectContaining({
				sid: accessPayload.sid,
				userId: "u1",
				aud: "sophon-web",
				currentRefreshJti: refreshPayload.jti,
				refreshExpiresAt: new Date(expSecs * 1000),
			}),
		);
	});

	it("verifyAccessToken: no sid → only issuer/aud checked", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			iss: MOCK_ENV.JWT_ISSUER,
			aud: "sophon-web",
			sub: "0xabc",
			iat: Math.floor(FIXED_NOW_MS / 1000),
			scope: "email",
		});

		const payload = await service.verifyAccessToken("access.jwt");
		expect(payload.aud).toBe("sophon-web");
		expect(sessionsMock.getBySid).not.toHaveBeenCalled();
	});

	it("verifyAccessToken: sid present but session inactive → throws", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			iss: MOCK_ENV.JWT_ISSUER,
			aud: "sophon-web",
			sub: "0xabc",
			iat: Math.floor(FIXED_NOW_MS / 1000),
			sid: "sid-1",
			scope: "email",
		});

		const row: SessionRow = {
			current_refresh_jti: "j1",
			refresh_expires_at: new Date(FIXED_NOW_MS + 10_000),
			revoked_at: new Date(FIXED_NOW_MS), // inactive
			invalidate_before: null,
		};
		sessionsMock.getBySid.mockResolvedValueOnce(row);
		sessionsMock.isActive.mockReturnValueOnce(false);

		await expect(service.verifyAccessToken("access.jwt")).rejects.toThrow(
			UnauthorizedException,
		);
	});

	it("verifyAccessToken: sid present, active, but iat < invalidate_before → throws", async () => {
		const iat = Math.floor(FIXED_NOW_MS / 1000) - 100; // token issued 100s before now
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			iss: MOCK_ENV.JWT_ISSUER,
			aud: "sophon-web",
			sub: "0xabc",
			iat,
			sid: "sid-2",
			scope: "email",
		});

		const row: SessionRow = {
			current_refresh_jti: "j2",
			refresh_expires_at: new Date(FIXED_NOW_MS + 10_000),
			revoked_at: null,
			invalidate_before: new Date(FIXED_NOW_MS - 10_000), // 10s earlier than now, but 90s after iat
		};
		sessionsMock.getBySid.mockResolvedValueOnce(row);
		sessionsMock.isActive.mockReturnValueOnce(true);

		await expect(service.verifyAccessToken("access.jwt")).rejects.toThrow(
			UnauthorizedException,
		);
	});

	it("refresh: success path rotates jti and returns new tokens", async () => {
		// verified refresh token payload
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			iss: MOCK_ENV.REFRESH_ISSUER,
			aud: "sophon-web",
			sub: "0xabc",
			iat: Math.floor(FIXED_NOW_MS / 1000) - 100,
			sid: "sid-3",
			jti: "old-jti",
			scope: "email",
			userId: "u1",
			typ: "refresh",
		});

		// session row (active, current jti matches)
		const row: SessionRow = {
			current_refresh_jti: "old-jti",
			refresh_expires_at: new Date(FIXED_NOW_MS + 10_000),
			revoked_at: null,
			invalidate_before: null,
		};
		sessionsMock.getBySid.mockResolvedValueOnce(row);
		sessionsMock.isActive.mockReturnValueOnce(true);

		// sign new access + new refresh
		(jwt.sign as jest.Mock)
			.mockImplementationOnce(() => "new.access.jwt")
			.mockImplementationOnce(() => "new.refresh.jwt");

		// decode new refresh exp
		const nextExpSecs =
			Math.floor(FIXED_NOW_MS / 1000) + MOCK_ENV.REFRESH_TTL_S;
		(jwt.decode as jest.Mock).mockReturnValue({ exp: nextExpSecs });

		const { accessToken, refreshToken } = await service.refresh("refresh.jwt");
		expect(accessToken).toBe("new.access.jwt");
		expect(refreshToken).toBe("new.refresh.jwt");

		// check rotateRefreshJti called with the new jti used in refresh payload
		const signCalls = (jwt.sign as jest.Mock).mock.calls;
		const refreshPayload = signCalls[1][0] as { jti?: string; sid?: string };
		expect(typeof refreshPayload.jti).toBe("string");
		expect(refreshPayload.sid).toBe("sid-3");

		expect(sessionsMock.rotateRefreshJti).toHaveBeenCalledWith(
			expect.objectContaining({
				sid: "sid-3",
				newJti: refreshPayload.jti,
				newRefreshExpiresAt: new Date(nextExpSecs * 1000),
			}),
		);
	});

	it("refresh: reuse detection → revokes session and throws", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			iss: MOCK_ENV.REFRESH_ISSUER,
			aud: "sophon-web",
			sub: "0xabc",
			iat: Math.floor(FIXED_NOW_MS / 1000) - 100,
			sid: "sid-4",
			jti: "stale-jti",
			scope: "email",
			userId: "u1",
			typ: "refresh",
		});

		const row: SessionRow = {
			current_refresh_jti: "current-jti", // mismatch
			refresh_expires_at: new Date(FIXED_NOW_MS + 10_000),
			revoked_at: null,
			invalidate_before: null,
		};
		sessionsMock.getBySid.mockResolvedValueOnce(row);
		sessionsMock.isActive.mockReturnValueOnce(true);

		await expect(service.refresh("refresh.jwt")).rejects.toThrow(
			UnauthorizedException,
		);
		expect(sessionsMock.revokeSid).toHaveBeenCalledWith("sid-4");
	});

	it("revokeByRefreshToken: valid refresh token → revokes", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			iss: MOCK_ENV.REFRESH_ISSUER,
			aud: "sophon-web",
			sub: "0xabc",
			sid: "sid-5",
			jti: "jti-5",
			typ: "refresh",
		});

		await service.revokeByRefreshToken("refresh.jwt");
		expect(sessionsMock.revokeSid).toHaveBeenCalledWith("sid-5");
	});

	it("revokeByRefreshToken: invalid token → no-op", async () => {
		(jwt.verify as jest.Mock).mockImplementationOnce(() => {
			throw new Error("bad");
		});

		await service.revokeByRefreshToken("refresh.jwt");
		expect(sessionsMock.revokeSid).not.toHaveBeenCalled();
	});

	it("revokeByRefreshToken: non-refresh typ → no-op", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			iss: MOCK_ENV.REFRESH_ISSUER,
			aud: "sophon-web",
			sub: "0xabc",
			sid: "sid-6",
			jti: "jti-6",
			typ: "access",
		});

		await service.revokeByRefreshToken("access.jwt");
		expect(sessionsMock.revokeSid).not.toHaveBeenCalled();
	});

	it("cookie options reflect env", () => {
		const a = service.cookieOptions();
		expect(a).toMatchObject({
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			domain: "localhost",
			path: "/",
			maxAge: MOCK_ENV.COOKIE_ACCESS_MAX_AGE_S * 1000,
		});

		const r = service.refreshCookieOptions();
		expect(r).toMatchObject({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			domain: "localhost",
			path: "/auth/refresh",
			maxAge: MOCK_ENV.COOKIE_REFRESH_MAX_AGE_S * 1000,
		});
	});
});

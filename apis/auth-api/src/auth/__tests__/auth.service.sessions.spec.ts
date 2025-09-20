import {
	ForbiddenException,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import type { TypedDataDefinition } from "viem";
import { JwtKeysService } from "../../aws/jwt-keys.service";
import { authConfig } from "../../config/auth.config";
import { PartnerRegistryService } from "../../partners/partner-registry.service";
import { SessionsRepository } from "../../sessions/sessions.repository";
import { AuthService } from "../auth.service";

// ---- Mocks ----
jest.mock("jsonwebtoken", () => ({
	sign: jest.fn(),
	verify: jest.fn(),
	decode: jest.fn(),
}));

jest.mock("../../utils/signature", () => ({
	verifyEIP1271Signature: jest.fn().mockResolvedValue(true),
}));

const MOCK_AUTH = {
	accessTtlS: 60 * 60 * 3, // 3h
	refreshTtlS: 60 * 60 * 24 * 90, // 90d
	nonceTtlS: 600, // 10m

	jwtKid: "test-kid",
	jwtIssuer: "https://auth.example.com",
	nonceIssuer: "https://auth.example.com/nonce",
	refreshIssuer: "https://auth.example.com/refresh",
	refreshJwtKid: "refresh-kid",

	cookieDomain: "localhost",
	cookieAccessMaxAgeS: 60 * 60 * 3,
	cookieRefreshMaxAgeS: 60 * 60 * 24 * 90,

	jwtAudience: "example-client",
	partnerCdn: "https://cdn.sophon.xyz/partners/sdk",
} as const;

describe("AuthService (sessions + refresh)", () => {
	let service: AuthService;

	const partnerRegistryMock: jest.Mocked<PartnerRegistryService> = {
		assertExists: jest.fn().mockResolvedValue(undefined),
		exists: jest.fn().mockResolvedValue(true),
	} as unknown as jest.Mocked<PartnerRegistryService>;

	// sessions repo mock
	type SessionRow = {
		sid?: string | null;
		userId?: string | null;
		aud?: string | null;
		currentRefreshJti: string | null;
		refreshExpiresAt: Date | null;
		revokedAt: Date | null;
		invalidateBefore: Date | null;
		createdIp?: string | null;
		createdUserAgent?: string | null;
		createdAt?: Date | null;
	};

	const sessionsMock: {
		create: jest.Mock<Promise<void>, [unknown]>;
		getBySid: jest.Mock<Promise<SessionRow | null>, [string]>;
		isActive: jest.Mock<boolean, [SessionRow | null]>;
		rotateRefreshJti: jest.Mock<Promise<void>, [unknown]>;
		revokeSid: jest.Mock<Promise<void>, [string]>;
		findActiveForUser: jest.Mock<Promise<SessionRow[]>, [string]>;
	} = {
		create: jest.fn(),
		getBySid: jest.fn(),
		isActive: jest.fn(),
		rotateRefreshJti: jest.fn(),
		revokeSid: jest.fn(),
		findActiveForUser: jest.fn(),
	};

	const jwtKeysServiceMock: jest.Mocked<JwtKeysService> = {
		getAccessPrivateKey: jest.fn().mockResolvedValue("PRIV"),
		getAccessPublicKey: jest.fn().mockResolvedValue("PUB"),
		getRefreshPrivateKey: jest.fn().mockResolvedValue("RPRIV"),
		getRefreshPublicKey: jest.fn().mockResolvedValue("RPUB"),
		getAccessKid: jest.fn().mockResolvedValue("kid"),
		getRefreshKid: jest.fn().mockResolvedValue("rkid"),
	} as unknown as jest.Mocked<JwtKeysService>;

	const FIXED_NOW_MS = 1_700_000_000_000; // fixed now for deterministic tests
	let dateNowSpy: jest.SpyInstance<number, []>;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: PartnerRegistryService, useValue: partnerRegistryMock },
				{ provide: SessionsRepository, useValue: sessionsMock },
				{ provide: authConfig.KEY, useValue: MOCK_AUTH },
				{ provide: JwtKeysService, useValue: jwtKeysServiceMock },
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
			iss: MOCK_AUTH.nonceIssuer,
			scope: "email x",
			userId: "u1",
		});

		// access + refresh token signatures
		(jwt.sign as jest.Mock)
			.mockImplementationOnce(() => "access.jwt") // access
			.mockImplementationOnce(() => "refresh.jwt"); // refresh

		// decode refresh for exp -> session.refresh_expires_at
		const expSecs = Math.floor(FIXED_NOW_MS / 1000) + MOCK_AUTH.refreshTtlS;
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
			iss: MOCK_AUTH.jwtIssuer,
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
			iss: MOCK_AUTH.jwtIssuer,
			aud: "sophon-web",
			sub: "0xabc",
			iat: Math.floor(FIXED_NOW_MS / 1000),
			sid: "sid-1",
			scope: "email",
		});

		const row: SessionRow = {
			currentRefreshJti: "j1",
			refreshExpiresAt: new Date(FIXED_NOW_MS + 10_000),
			revokedAt: new Date(FIXED_NOW_MS), // inactive
			invalidateBefore: null,
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
			iss: MOCK_AUTH.jwtIssuer,
			aud: "sophon-web",
			sub: "0xabc",
			iat,
			sid: "sid-2",
			scope: "email",
		});

		const row: SessionRow = {
			currentRefreshJti: "j2",
			refreshExpiresAt: new Date(FIXED_NOW_MS + 10_000),
			revokedAt: null,
			invalidateBefore: new Date(FIXED_NOW_MS - 10_000), // 10s earlier than now, but 90s after iat
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
			iss: MOCK_AUTH.refreshIssuer,
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
			currentRefreshJti: "old-jti",
			refreshExpiresAt: new Date(FIXED_NOW_MS + 10_000),
			revokedAt: null,
			invalidateBefore: null,
		};
		sessionsMock.getBySid.mockResolvedValueOnce(row);
		sessionsMock.isActive.mockReturnValueOnce(true);

		// sign new access + new refresh
		(jwt.sign as jest.Mock)
			.mockImplementationOnce(() => "new.access.jwt")
			.mockImplementationOnce(() => "new.refresh.jwt");

		// decode new refresh exp
		const nextExpSecs = Math.floor(FIXED_NOW_MS / 1000) + MOCK_AUTH.refreshTtlS;
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
			iss: MOCK_AUTH.refreshIssuer,
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
			currentRefreshJti: "current-jti", // mismatch
			refreshExpiresAt: new Date(FIXED_NOW_MS + 10_000),
			revokedAt: null,
			invalidateBefore: null,
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
			iss: MOCK_AUTH.refreshIssuer,
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
			iss: MOCK_AUTH.refreshIssuer,
			aud: "sophon-web",
			sub: "0xabc",
			sid: "sid-6",
			jti: "jti-6",
			typ: "access",
		});

		await service.revokeByRefreshToken("access.jwt");
		expect(sessionsMock.revokeSid).not.toHaveBeenCalled();
	});

	it("cookie options reflect config", () => {
		const a = service.cookieOptions();
		expect(a).toMatchObject({
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			domain: MOCK_AUTH.cookieDomain,
			path: "/",
			maxAge: MOCK_AUTH.cookieAccessMaxAgeS * 1000,
		});

		const r = service.refreshCookieOptions();
		expect(r).toMatchObject({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			domain: MOCK_AUTH.cookieDomain,
			path: "/auth/refresh",
			maxAge: MOCK_AUTH.cookieRefreshMaxAgeS * 1000,
		});
	});

	it("verifySignatureWithSiweIssueTokens: stores createdIp & createdUserAgent in session", async () => {
		(jwt.verify as jest.Mock).mockReturnValueOnce({
			nonce: "nonce.jwt",
			address: "0x1234567890abcdef1234567890abcdef12345678",
			aud: "sophon-web",
			iss: MOCK_AUTH.nonceIssuer,
			scope: "email x",
			userId: "u1",
		});

		(jwt.sign as jest.Mock)
			.mockImplementationOnce(() => "access.jwt")
			.mockImplementationOnce(() => "refresh.jwt");

		const expSecs = Math.floor(FIXED_NOW_MS / 1000) + MOCK_AUTH.refreshTtlS;
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

		await service.verifySignatureWithSiweIssueTokens(
			"0x1234567890abcdef1234567890abcdef12345678",
			typedData,
			"0xsignature",
			"nonce.jwt",
			{ ip: "203.0.113.9", userAgent: "Jest UA/1.0" },
		);

		expect(sessionsMock.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "u1",
				aud: "sophon-web",
				currentRefreshJti: expect.any(String),
				refreshExpiresAt: new Date(expSecs * 1000),
				createdIp: "203.0.113.9",
				createdUserAgent: "Jest UA/1.0",
			}),
		);
	});

	it("listActiveSessionsForUser: returns all, and filters by aud when provided", async () => {
		const make = (over: Partial<SessionRow>) =>
			({
				sid: `S-${Math.random().toString(16).slice(2)}`,
				userId: "u1",
				aud: "a1",
				currentRefreshJti: "j",
				refreshExpiresAt: new Date(FIXED_NOW_MS + 1_000_000),
				revokedAt: null,
				invalidateBefore: null,
				createdIp: "10.0.0.1",
				createdUserAgent: "UA",
				createdAt: new Date(FIXED_NOW_MS - 1_000),
				...over,
			}) as SessionRow;

		sessionsMock.findActiveForUser.mockResolvedValue([
			make({ sid: "S1", aud: "a1" }),
			make({ sid: "S2", aud: "a2" }),
			make({ sid: "S3", aud: "a1" }),
		]);

		const all = await service.listActiveSessionsForUser("u1");
		expect(all.map((s) => s.sid)).toEqual(["S1", "S2", "S3"]);
		expect(sessionsMock.findActiveForUser).toHaveBeenCalledWith("u1");

		const onlyA1 = await service.listActiveSessionsForUser("u1", "a1");
		expect(onlyA1.map((s) => s.sid)).toEqual(["S1", "S3"]);
	});

	it("revokeSessionForUser: happy path", async () => {
		sessionsMock.getBySid.mockResolvedValue({
			sid: "S1",
			userId: "u1",
			aud: "a1",
			currentRefreshJti: "j1",
			refreshExpiresAt: new Date(FIXED_NOW_MS + 10_000),
			revokedAt: null,
			invalidateBefore: null,
			createdIp: "1.2.3.4",
			createdUserAgent: "UA",
		});

		await service.revokeSessionForUser("u1", "S1");
		expect(sessionsMock.revokeSid).toHaveBeenCalledWith("S1");
	});

	it("revokeSessionForUser: not found", async () => {
		sessionsMock.getBySid.mockResolvedValue(null);
		await expect(
			service.revokeSessionForUser("u1", "missing"),
		).rejects.toBeInstanceOf(NotFoundException);
		expect(sessionsMock.revokeSid).not.toHaveBeenCalled();
	});

	it("revokeSessionForUser: forbidden (belongs to another user)", async () => {
		sessionsMock.getBySid.mockResolvedValue({
			sid: "S2",
			userId: "someone-else",
			aud: "a1",
			currentRefreshJti: "j2",
			refreshExpiresAt: new Date(FIXED_NOW_MS + 10_000),
			revokedAt: null,
			invalidateBefore: null,
			createdIp: "9.9.9.9",
			createdUserAgent: "UA",
		});

		await expect(
			service.revokeSessionForUser("u1", "S2"),
		).rejects.toBeInstanceOf(ForbiddenException);
		expect(sessionsMock.revokeSid).not.toHaveBeenCalled();
	});
});

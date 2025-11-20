import { UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { LoggerModule } from "nestjs-pino";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import type { VerifySiweDto } from "../dto/verify-siwe.dto";
import { MeService } from "../me.service";
import type { AccessTokenPayload } from "../types";

const loggerModule = LoggerModule.forRoot({ pinoHttp: { enabled: false } });
describe("AuthController (new flows)", () => {
	let controller: AuthController;

	const authServiceMock = {
		generateNonceTokenForAddress: jest.fn().mockResolvedValue("nonce.jwt"),
		verifySignatureWithSiweIssueTokens: jest.fn().mockResolvedValue({
			accessToken: "access.jwt",
			refreshToken: "refresh.jwt",
			sid: "sid-1",
		}),
		refresh: jest.fn().mockResolvedValue({
			accessToken: "new.access.jwt",
			refreshToken: "new.refresh.jwt",
		}),
		revokeByRefreshToken: jest.fn().mockResolvedValue(undefined),
		cookieOptions: jest.fn().mockReturnValue({
			httpOnly: true,
			secure: true,
			sameSite: "none",
			domain: "localhost",
			maxAge: 10800,
		}),
		refreshCookieOptions: jest.fn().mockReturnValue({
			httpOnly: true,
			secure: true,
			sameSite: "none",
			domain: "localhost",
			maxAge: 7776000,
		}),
	};

	type WithSub = { sub?: string };

	const meServiceMock = {
		buildMeResponse: jest
			.fn()
			.mockImplementation((user: AccessTokenPayload & WithSub) => ({
				sub: user.sub ?? "0xabc",
				scope: user.scope,
				aud: user.aud,
				userId: user.userId,
			})),
	};

	const mockRes = (): Response =>
		({
			set: jest.fn().mockReturnThis(),
			cookie: jest.fn().mockReturnThis(),
			clearCookie: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		}) as unknown as Response;

	const mockReq = (overrides: Partial<Request> = {}): Request =>
		({
			cookies: {},
			headers: {},
			ip: "127.0.0.1",
			socket: { remoteAddress: "127.0.0.1" },
			...overrides,
		}) as unknown as Request;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			imports: [loggerModule],
			controllers: [AuthController],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: MeService, useValue: meServiceMock },
			],
		}).compile();

		controller = module.get(AuthController);
		jest.clearAllMocks();
	});

	it("POST /auth/verify sets both cookies and returns access token", async () => {
		const res = mockRes();
		const req = mockReq();

		const body = {
			address: "0xabc0000000000000000000000000000000000001",
			typedData: {} as unknown as VerifySiweDto["typedData"],
			signature: "0xsignature",
			nonceToken: "nonce.jwt",
		} as unknown as VerifySiweDto;

		await controller.verifySignature(body, res, req);

		expect(
			authServiceMock.verifySignatureWithSiweIssueTokens,
		).toHaveBeenCalled();
		expect(res.cookie).toHaveBeenCalledWith(
			"access_token",
			"access.jwt",
			expect.objectContaining({ httpOnly: true }),
		);
		expect(res.cookie).toHaveBeenCalledWith(
			"refresh_token",
			"refresh.jwt",
			expect.objectContaining({ httpOnly: true }),
		);
		expect(res.json).toHaveBeenCalledWith({
			accessToken: "access.jwt",
			refreshToken: "refresh.jwt",
		});
	});

	it("POST /auth/refresh reads refresh token from cookie, rotates tokens, sets cookies", async () => {
		const res = mockRes();
		const req = {
			cookies: { refresh_token: "refresh.jwt" },
			headers: {},
		} as unknown as Request;

		await controller.refresh(req, res);

		expect(authServiceMock.refresh).toHaveBeenCalledWith(
			"refresh.jwt",
			expect.objectContaining({
				ip: expect.any(String),
				userAgent: expect.any(String),
			}),
		);
		expect(res.cookie).toHaveBeenCalledWith(
			"access_token",
			"new.access.jwt",
			expect.any(Object),
		);
		expect(res.cookie).toHaveBeenCalledWith(
			"refresh_token",
			"new.refresh.jwt",
			expect.any(Object),
		);
		expect(res.json).toHaveBeenCalledWith({
			accessToken: "new.access.jwt",
			refreshToken: "new.refresh.jwt",
		});
	});

	it("POST /auth/refresh reads refresh token from Authorization header if cookie missing", async () => {
		const res = mockRes();
		const req = {
			cookies: {},
			headers: { authorization: "Bearer hdr.refresh.jwt" },
		} as unknown as Request;

		await controller.refresh(req, res);

		expect(authServiceMock.refresh).toHaveBeenCalledWith(
			"hdr.refresh.jwt",
			expect.objectContaining({
				ip: expect.any(String),
				userAgent: expect.any(String),
			}),
		);
	});

	it("POST /auth/refresh returns 401 if no refresh token provided", async () => {
		const res = mockRes();
		const req = { cookies: {}, headers: {} } as unknown as Request;

		await expect(controller.refresh(req, res)).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
		expect(authServiceMock.refresh).not.toHaveBeenCalled();
	});

	it("POST /auth/logout revokes session if refresh token present and clears both cookies", async () => {
		const res = mockRes();
		const req = {
			cookies: { refresh_token: "refresh.jwt" },
			headers: {},
		} as unknown as Request;

		await controller.logout(req, res);

		expect(authServiceMock.revokeByRefreshToken).toHaveBeenCalledWith(
			"refresh.jwt",
		);
		expect(res.clearCookie).toHaveBeenCalledWith(
			"access_token",
			expect.objectContaining({ maxAge: 0 }),
		);
		expect(res.clearCookie).toHaveBeenCalledWith(
			"refresh_token",
			expect.objectContaining({ maxAge: 0 }),
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ ok: true });
	});

	it("POST /auth/logout still clears cookies when no refresh token is provided", async () => {
		const res = mockRes();
		const req = {
			cookies: {},
			headers: {},
		} as unknown as Request;

		await controller.logout(req, res);

		expect(authServiceMock.revokeByRefreshToken).not.toHaveBeenCalled();
		expect(res.clearCookie).toHaveBeenCalledWith(
			"access_token",
			expect.objectContaining({ maxAge: 0 }),
		);
		expect(res.clearCookie).toHaveBeenCalledWith(
			"refresh_token",
			expect.objectContaining({ maxAge: 0 }),
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ ok: true });
	});

	it("GET /auth/me returns meService response", async () => {
		const userPayload: AccessTokenPayload & WithSub = {
			aud: "sophon-web",
			userId: "u1",
			scope: "email x",
			sub: "0xabc",
			chainId: 300,
		};

		const req = { user: userPayload } as unknown as Request & {
			user: AccessTokenPayload & WithSub;
		};
		const result = await controller.me(req);

		expect(meServiceMock.buildMeResponse).toHaveBeenCalledWith(userPayload);
		expect(result).toEqual({
			sub: "0xabc",
			scope: "email x",
			aud: "sophon-web",
			userId: "u1",
		});
	});

	it("POST /auth/verify embeds consent timestamps in the access token", async () => {
		const res = mockRes();
		const req = mockReq();

		const PA = Math.floor(new Date("2025-01-01T00:00:00Z").getTime() / 1000);
		const SD = Math.floor(new Date("2025-01-02T00:00:00Z").getTime() / 1000);

		const tokenWithConsent = jwt.sign(
			{
				sub: "0xabc0000000000000000000000000000000000001",
				aud: "sophon-web",
				consent: { pa: PA, sd: SD },
				iat: Math.floor(Date.now() / 1000),
			},
			"test-secret",
			{ algorithm: "HS256" },
		);

		authServiceMock.verifySignatureWithSiweIssueTokens.mockResolvedValueOnce({
			accessToken: tokenWithConsent,
			refreshToken: "refresh.jwt",
			sid: "sid-1",
		});

		const body = {
			address: "0xabc0000000000000000000000000000000000001",
			typedData: {} as unknown as VerifySiweDto["typedData"],
			signature: "0xsignature",
			nonceToken: "nonce.jwt",
		} as unknown as VerifySiweDto;

		await controller.verifySignature(body, res, req);

		expect(res.json).toHaveBeenCalled();
		const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
		const accessToken = jsonArg.accessToken;

		expect(res.cookie).toHaveBeenCalledWith(
			"access_token",
			tokenWithConsent,
			expect.any(Object),
		);

		const payload = jwt.verify(accessToken, "test-secret", {
			algorithms: ["HS256"],
		}) as jwt.JwtPayload & {
			consent?: Record<string, unknown>;
			[k: string]: unknown;
		};
		expect(payload).toBeTruthy();
		console.log("payload", payload);
		const bucket = payload.consent ?? payload;
		const pa =
			bucket.pa ??
			bucket.personalizationAds ??
			bucket["consent.personalization_ads"];
		const sd =
			bucket.sd ?? bucket.sharingData ?? bucket["consent.sharing_data"];

		expect(pa).toBe(PA);
		expect(sd).toBe(SD);
	});

	it("POST /auth/verify returns an access token with no consent when none is present", async () => {
		const res = mockRes();
		const req = mockReq();

		// Build a JWT with no consent fields
		const tokenWithoutConsent = jwt.sign(
			{
				sub: "0xabc0000000000000000000000000000000000001",
				aud: "sophon-web",
				iat: Math.floor(Date.now() / 1000),
				// deliberately omit consent/pa/sd
			},
			"test-secret",
			{ algorithm: "HS256" },
		);

		// Make the service return our crafted token
		authServiceMock.verifySignatureWithSiweIssueTokens.mockResolvedValueOnce({
			accessToken: tokenWithoutConsent,
			refreshToken: "refresh.jwt",
			sid: "sid-1",
		});

		const body = {
			address: "0xabc0000000000000000000000000000000000001",
			typedData: {} as unknown as VerifySiweDto["typedData"],
			signature: "0xsignature",
			nonceToken: "nonce.jwt",
		} as unknown as VerifySiweDto;

		await controller.verifySignature(body, res, req);

		// Assert cookies + json returned our token
		expect(res.cookie).toHaveBeenCalledWith(
			"access_token",
			tokenWithoutConsent,
			expect.any(Object),
		);
		const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
		const accessToken = jsonArg.accessToken;
		expect(accessToken).toBe(tokenWithoutConsent);

		const payload = jwt.verify(accessToken, "test-secret", {
			algorithms: ["HS256"],
		}) as jwt.JwtPayload & {
			consent?: Record<string, unknown>;
			[k: string]: unknown;
		};
		expect(payload).toBeTruthy();

		expect(payload.consent).toBeUndefined();

		const pa =
			payload.pa ??
			payload.personalizationAds ??
			payload["consent.personalization_ads"];
		const sd =
			payload.sd ?? payload.sharingData ?? payload["consent.sharing_data"];
		console.log("payload", payload);
		expect(pa).toBeUndefined();
		expect(sd).toBeUndefined();
	});

	it("POST /auth/verify embeds only PA when only one consent is present", async () => {
		const res = mockRes();
		const req = mockReq();

		const PA = Math.floor(new Date("2025-01-03T00:00:00Z").getTime() / 1000);

		const tokenOnlyPa = jwt.sign(
			{
				sub: "0xabc0000000000000000000000000000000000001",
				aud: "sophon-web",
				consent: { pa: PA }, // only PA
				iat: Math.floor(Date.now() / 1000),
			},
			"test-secret",
			{ algorithm: "HS256" },
		);

		authServiceMock.verifySignatureWithSiweIssueTokens.mockResolvedValueOnce({
			accessToken: tokenOnlyPa,
			refreshToken: "refresh.jwt",
			sid: "sid-1",
		});

		const body = {
			address: "0xabc0000000000000000000000000000000000001",
			typedData: {} as unknown as VerifySiweDto["typedData"],
			signature: "0xsignature",
			nonceToken: "nonce.jwt",
		} as unknown as VerifySiweDto;

		await controller.verifySignature(body, res, req);

		// ensure same token was returned + set in cookie
		const accessToken = (res.json as jest.Mock).mock.calls[0][0].accessToken;
		expect(accessToken).toBe(tokenOnlyPa);
		expect(res.cookie).toHaveBeenCalledWith(
			"access_token",
			tokenOnlyPa,
			expect.any(Object),
		);

		const payload = jwt.verify(accessToken, "test-secret", {
			algorithms: ["HS256"],
		}) as jwt.JwtPayload & {
			consent?: Record<string, unknown>;
			[k: string]: unknown;
		};

		const bucket = payload.consent ?? payload;
		const pa =
			(bucket.pa as number | undefined) ??
			(bucket.personalizationAds as number | undefined) ??
			(bucket["consent.personalization_ads"] as number | undefined);
		const sd =
			(bucket.sd as number | undefined) ??
			(bucket.sharingData as number | undefined) ??
			(bucket["consent.sharing_data"] as number | undefined);

		expect(pa).toBe(PA);
		expect(sd).toBeUndefined();
	});

	it("POST /auth/verify embeds only SD when only one consent is present", async () => {
		const res = mockRes();
		const req = mockReq();

		const SD = Math.floor(new Date("2025-01-04T00:00:00Z").getTime() / 1000);

		const tokenOnlySd = jwt.sign(
			{
				sub: "0xabc0000000000000000000000000000000000001",
				aud: "sophon-web",
				consent: { sd: SD }, // only SD
				iat: Math.floor(Date.now() / 1000),
			},
			"test-secret",
			{ algorithm: "HS256" },
		);

		authServiceMock.verifySignatureWithSiweIssueTokens.mockResolvedValueOnce({
			accessToken: tokenOnlySd,
			refreshToken: "refresh.jwt",
			sid: "sid-1",
		});

		const body = {
			address: "0xabc0000000000000000000000000000000000001",
			typedData: {} as unknown as VerifySiweDto["typedData"],
			signature: "0xsignature",
			nonceToken: "nonce.jwt",
		} as unknown as VerifySiweDto;

		await controller.verifySignature(body, res, req);

		const accessToken = (res.json as jest.Mock).mock.calls[0][0].accessToken;
		expect(accessToken).toBe(tokenOnlySd);
		expect(res.cookie).toHaveBeenCalledWith(
			"access_token",
			tokenOnlySd,
			expect.any(Object),
		);

		const payload = jwt.verify(accessToken, "test-secret", {
			algorithms: ["HS256"],
		}) as jwt.JwtPayload & {
			consent?: Record<string, unknown>;
			[k: string]: unknown;
		};

		const bucket = payload.consent ?? payload;
		const pa =
			(bucket.pa as number | undefined) ??
			(bucket.personalizationAds as number | undefined) ??
			(bucket["consent.personalization_ads"] as number | undefined);
		const sd =
			(bucket.sd as number | undefined) ??
			(bucket.sharingData as number | undefined) ??
			(bucket["consent.sharing_data"] as number | undefined);

		expect(sd).toBe(SD);
		expect(pa).toBeUndefined();
	});
});

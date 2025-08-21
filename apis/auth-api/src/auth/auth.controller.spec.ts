import { Test } from "@nestjs/testing";
import type { Request, Response } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MeService } from "./me.service";
import { AccessTokenPayload } from "./types";

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

  const meServiceMock = {
    buildMeResponse: jest.fn().mockImplementation((user: AccessTokenPayload) => ({
      sub: (user as any).sub ?? "0xabc",
      scope: user.scope,
      aud: user.aud,
      userId: user.userId,
    })),
  };

  const mockRes = (): Response =>
    ({
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as any as Response);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
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
    await controller.verifySignature(
      {
        address: "0xabc0000000000000000000000000000000000001",
        typedData: {} as any,
        signature: "0xsignature",
        nonceToken: "nonce.jwt",
      } as any,
      res,
    );

    expect(authServiceMock.verifySignatureWithSiweIssueTokens).toHaveBeenCalled();
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
    expect(res.json).toHaveBeenCalledWith({ token: "access.jwt" });
  });

  it("POST /auth/refresh reads refresh token from cookie, rotates tokens, sets cookies", async () => {
    const res = mockRes();
    const req = { cookies: { refresh_token: "refresh.jwt" }, headers: {} } as any as Request;

    await controller.refresh(req, res);

    expect(authServiceMock.refresh).toHaveBeenCalledWith("refresh.jwt");
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
    expect(res.json).toHaveBeenCalledWith({ token: "new.access.jwt" });
  });

  it("POST /auth/refresh reads refresh token from Authorization header if cookie missing", async () => {
    const res = mockRes();
    const req = {
      cookies: {},
      headers: { authorization: "Bearer hdr.refresh.jwt" },
    } as any as Request;

    await controller.refresh(req, res);

    expect(authServiceMock.refresh).toHaveBeenCalledWith("hdr.refresh.jwt");
  });

  it("POST /auth/refresh returns 401 if no refresh token provided", async () => {
    const res = mockRes();
    const req = { cookies: {}, headers: {} } as any as Request;

    await controller.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "missing refresh token" });
    expect(authServiceMock.refresh).not.toHaveBeenCalled();
  });

  it("POST /auth/logout clears both cookies", async () => {
    const res = mockRes();
    controller.logout(res);

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
    const userPayload = {
      aud: "sophon-web",
      userId: "u1",
      scope: "email x",
    } as any;

    const req = { user: userPayload } as any as Request & { user: any };
    const result = await controller.me(req);

    expect(meServiceMock.buildMeResponse).toHaveBeenCalledWith(userPayload);
    expect(result).toEqual({
      sub: "0xabc",
      scope: "email x",
      aud: "sophon-web",
      userId: "u1",
    });
  });
});

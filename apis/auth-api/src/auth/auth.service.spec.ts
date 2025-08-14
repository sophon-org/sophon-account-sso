import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import { TypedDataDefinition } from "viem";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { AuthService } from "./auth.service";

// --- jsonwebtoken mocks ---
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mocked.token"),
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
}));

jest.mock("../config/env", () => ({
  getJwtKid: jest.fn().mockReturnValue("test-kid"),
  JWT_ISSUER: "https://auth.example.com",
  JWT_AUDIENCE: "example-client",
  ALLOWED_AUDIENCES: ["sophon-web", "sophon-admin", "partner-x"],
}));

describe("AuthService", () => {
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

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should generate a nonce token", async () => {
    const token = await service.generateNonceTokenForAddress(
      "0x1234567890abcdef1234567890abcdef12345678",
      "sophon-web",
    );

    expect(token).toBe("mocked.token");
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        nonce: expect.any(String),
        address: "0x1234567890abcdef1234567890abcdef12345678",
      }),
      "PRIVATE_KEY",
      expect.objectContaining({
        algorithm: "RS256",
        keyid: "test-kid",
        issuer: "https://auth.example.com",
        audience: "sophon-web",
        subject: "0x1234567890abcdef1234567890abcdef12345678",
        expiresIn: "10m",
      }),
    );
  });

  it("should verify signature and return JWT", async () => {
    (jwt.verify as jest.Mock).mockReturnValueOnce({
      nonce: "expected-nonce",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      aud: "sophon-web",
      iss: process.env.NONCE_ISSUER,
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
      "mocked-nonce-token",
      true,
    );

    expect(token).toBe("mocked.token");
  });

  it("should throw on nonce mismatch", async () => {
    (jwt.verify as jest.Mock).mockReturnValueOnce({
      nonce: "anything-here",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      aud: "sophon-web",
      iss: process.env.NONCE_ISSUER,
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
    ).rejects.toThrow("Nonce or address mismatch");
  });

  it("should return correct cookie options (rememberMe=false)", () => {
    const options = service.cookieOptions(false);
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 3,
      domain: "localhost",
    });
  });

  it("should return correct cookie options (rememberMe=true)", () => {
    const options = service.cookieOptions(true);
    expect(options.maxAge).toBe(60 * 60 * 24 * 7);
  });
});

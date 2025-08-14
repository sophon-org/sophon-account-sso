import { Test, type TestingModule } from "@nestjs/testing";
import { jwtVerify, SignJWT } from "jose";
import { AuthService } from "./auth.service";

// --- jose mocks ---
jest.mock("jose", () => {
  const original = jest.requireActual("jose");
  return {
    ...original,
    jwtVerify: jest.fn(),
    SignJWT: jest.fn().mockImplementation(() => {
      const jwt = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        // ADDED
        setSubject: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue("mocked.token"),
      };
      return jwt;
    }),
  };
});

// --- signature verifier mock (you call verifyEIP1271Signature) ---
jest.mock("../utils/signature", () => ({
  verifyEIP1271Signature: jest.fn().mockResolvedValue(true),
}));

// --- key/env mocks ---
jest.mock("../utils/jwt", () => ({
  getPrivateKey: jest.fn().mockResolvedValue("PRIVATE_KEY"),
  getPublicKey: jest.fn().mockReturnValue("PUBLIC_KEY"),
}));

jest.mock("../config/env", () => ({
  getJwtKid: jest.fn().mockReturnValue("test-kid"),
  JWT_ISSUER: "https://auth.example.com",
  JWT_AUDIENCE: "example-client",
}));

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {

    process.env.NONCE_ISSUER = "https://auth.example.com";

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should generate a nonce token", async () => {
    const token = await service.generateNonceTokenForAddress(
      "0x1234567890abcdef1234567890abcdef12345678",
      "example-aud"
    );
    expect(token).toBe("mocked.token");
    // Optional: assert SignJWT was built with expected methods
    expect((SignJWT as unknown as jest.Mock)).toHaveBeenCalled();
  });

  it("should verify signature and return JWT", async () => {
    // jwtVerify returns the decoded/verified payload for the nonce token
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: {
        nonce: "expected-nonce",
        address: "0x1234567890abcdef1234567890abcdef12345678",
        aud: "example-aud",
        iss: process.env.NONCE_ISSUER,
      },
    });

    const typedData: any = {
      domain: { name: "Sophon SSO", version: "1", chainId: 300 }, 
      types: {},
      primaryType: "Login",
      message: {
        from: "0x1234567890abcdef1234567890abcdef12345678",
        nonce: "mocked-nonce-token",
        audience: "example-aud",
      },
    };

    const token = await service.verifySignatureWithSiwe(
      "0x1234567890abcdef1234567890abcdef12345678", // address param
      typedData,
      "0xsignature",
      "mocked-nonce-token",
      true // rememberMe
    );

    expect(token).toBe("mocked.token");
  });

  it("should throw on nonce mismatch", async () => {
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: {
        nonce: "anything-here", // not used for mismatch in your code
        address: "0x1234567890abcdef1234567890abcdef12345678",
        aud: "example-aud",
        iss: process.env.NONCE_ISSUER,
      },
    });

    const typedData: any = {
      domain: { name: "Sophon SSO", version: "1", chainId: 300 },
      types: {},
      primaryType: "Login",
      message: {
        from: "0x1234567890abcdef1234567890abcdef12345678",
        nonce: "DIFFERENT-NONCE",
        audience: "example-aud",
      },
    };

    await expect(() =>
      service.verifySignatureWithSiwe(
        "0x1234567890abcdef1234567890abcdef12345678",
        typedData,
        "0xsignature",
        "mocked-nonce-token" // <- different from message.nonce above
      )
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

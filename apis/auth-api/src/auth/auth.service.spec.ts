import { Test } from "@nestjs/testing";

const joseP = import("jose");

import { TypedDataDefinition } from "viem";
import { PartnerRegistryService } from "../partners/partner-registry.service";
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
		const { SignJWT } = await joseP;
		// Optional: assert SignJWT was built with expected methods
		expect(SignJWT as unknown as jest.Mock).toHaveBeenCalled();
	});

	it("should verify signature and return JWT", async () => {
		// jwtVerify returns the decoded/verified payload for the nonce token
		const { jwtVerify } = await joseP;
		(jwtVerify as jest.Mock).mockResolvedValueOnce({
			payload: {
				nonce: "expected-nonce",
				address: "0x1234567890abcdef1234567890abcdef12345678",
				aud: "sophon-web",
				iss: process.env.NONCE_ISSUER,
			},
		});

		const typedData: TypedDataDefinition = {
			domain: { name: "Sophon SSO", version: "1", chainId: 300 },
			types: {},
			primaryType: "Login",
			message: {
				from: "0x1234567890abcdef1234567890abcdef12345678",
				nonce: "mocked-nonce-token",
				audience: "sophon-web",
			},
		};

		const token = await service.verifySignatureWithSiwe(
			"0x1234567890abcdef1234567890abcdef12345678", // address param
			typedData,
			"0xsignature",
			"mocked-nonce-token",
			true, // rememberMe
		);

		expect(token).toBe("mocked.token");
	});

	it("should throw on nonce mismatch", async () => {
		const { jwtVerify } = await joseP;
		(jwtVerify as jest.Mock).mockResolvedValueOnce({
			payload: {
				nonce: "anything-here", // not used for mismatch in your code
				address: "0x1234567890abcdef1234567890abcdef12345678",
				aud: "sophon-web",
				iss: process.env.NONCE_ISSUER,
			},
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
				"mocked-nonce-token", // <- different from message.nonce above
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

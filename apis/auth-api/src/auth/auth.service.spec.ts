import { Test, type TestingModule } from "@nestjs/testing";
import { jwtVerify } from "jose";
import { SiweMessage } from "siwe";
import { AuthService } from "./auth.service.js";

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
				sign: jest.fn().mockResolvedValue("mocked.token"),
			};
			return jwt;
		}),
	};
});

jest.mock("siwe", () => {
	return {
		SiweMessage: jest.fn().mockImplementation(() => ({
			verify: jest.fn().mockResolvedValue({
				data: {
					nonce: "expected-nonce",
					address: "0x1234567890abcdef",
				},
			}),
		})),
	};
});

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
		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthService],
		}).compile();

		service = module.get<AuthService>(AuthService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	it("should generate a nonce token", async () => {
		const token = await service.generateNonceTokenForAddress("0x123");
		expect(token).toBe("mocked.token");
	});

	it("should verify SIWE signature and return JWT", async () => {
		(jwtVerify as jest.Mock).mockResolvedValueOnce({
			payload: {
				nonce: "expected-nonce",
				address: "0x1234567890abcdef",
			},
		});

		const token = await service.verifySignatureWithSiwe(
			"mocked-message",
			"mocked-signature",
			"mocked-nonce-token",
			true, // rememberMe
		);

		expect(token).toBe("mocked.token");
		expect(SiweMessage).toHaveBeenCalledWith("mocked-message");
	});

	it("should throw on nonce mismatch", async () => {
		(jwtVerify as jest.Mock).mockResolvedValueOnce({
			payload: {
				nonce: "wrong-nonce",
				address: "0x1234567890abcdef",
			},
		});

		await expect(() =>
			service.verifySignatureWithSiwe(
				"mocked-message",
				"mocked-signature",
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

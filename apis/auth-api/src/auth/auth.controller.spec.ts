import { Test, type TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard"; // ✅ add if used via @UseGuards
import { MeService } from "./me.service"; // ✅ add

describe("AuthController", () => {
	let controller: AuthController;

	const authServiceMock = {
		generateNonceTokenForAddress: jest.fn(),
		verifySignatureWithSiwe: jest.fn(),
		cookieOptions: jest.fn(() => ({})),
	};

	const meServiceMock = {
		buildMeResponse: jest.fn().mockResolvedValue({
			sub: "0xabc",
			aud: "sophon-web",
			iss: "https://auth.example.com",
			scope: ["email"],
			fields: {
				email: null,
				discord: null,
				google: null,
				telegram: null,
				x: null,
			},
			exp: undefined,
			iat: undefined,
		}),
	};

	const accessTokenGuardMock = { canActivate: jest.fn().mockReturnValue(true) };

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: MeService, useValue: meServiceMock }, // ✅ provide it
				{ provide: AccessTokenGuard, useValue: accessTokenGuardMock }, // ✅ if controller uses it
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});

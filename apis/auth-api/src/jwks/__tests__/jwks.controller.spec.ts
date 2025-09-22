import { Test, type TestingModule } from "@nestjs/testing";
import { JwtKeysService } from "../../aws/jwt-keys.service"; // adjust the path if needed
import { JwksController } from "../jwks.controller";

describe("JwksController", () => {
	let controller: JwksController;

	const jwtKeysServiceMock = {
		getAccessPublicKey: jest
			.fn()
			.mockResolvedValue(
				"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----\n",
			),
		getAccessKid: jest.fn().mockResolvedValue("test-kid-123"),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [JwksController],
			providers: [{ provide: JwtKeysService, useValue: jwtKeysServiceMock }],
		}).compile();

		controller = module.get<JwksController>(JwksController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});

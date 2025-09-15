import { Test, type TestingModule } from "@nestjs/testing";
import { AppController } from "../app.controller";
import { AppService } from "../app.service";

describe("AppController", () => {
	let controller: AppController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
			providers: [
				{
					provide: AppService,
					useValue: {
						getHello: jest.fn().mockReturnValue("Hello World!"),
					},
				},
			],
		}).compile();

		controller = module.get<AppController>(AppController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("should return 'Hello World!'", () => {
		expect(controller.getHello()).toBe("Hello World!");
	});
});

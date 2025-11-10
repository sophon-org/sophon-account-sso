import { Test, TestingModule } from "@nestjs/testing";
import { ContractDeployQueue } from "src/queues/workers/contract-deploy.queue";
import type { Address } from "viem";
import { ContractController } from "../contract.controller";
import { ContractService } from "../contract.service";

describe("ContractController", () => {
	let controller: ContractController;
	let service: jest.Mocked<ContractService>;
	let queue: { enqueue: jest.Mock; getJob: jest.Mock };

	beforeAll(() => {
		process.env.CHAIN_ID = "300";
	});

	beforeEach(async () => {
		queue = {
			enqueue: jest.fn(),
			getJob: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ContractController],
			providers: [
				{
					provide: ContractService,
					useValue: {
						getContractByOwner: jest.fn(),
						deployContractForOwner: jest.fn(),
					},
				},
				{
					provide: ContractDeployQueue,
					useValue: queue,
				},
			],
		}).compile();

		controller = module.get(ContractController);
		service = module.get(ContractService) as jest.Mocked<ContractService>;
	});

	afterEach(() => jest.clearAllMocks());

	it("byOwner → returns addresses from service", async () => {
		const owner = "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a" as Address;
		const addrs = [
			"0x1111111111111111111111111111111111111111" as Address,
			"0x2222222222222222222222222222222222222222" as Address,
		];
		service.getContractByOwner.mockResolvedValue(addrs);

		const res = await controller.byOwner(owner);

		expect(service.getContractByOwner).toHaveBeenCalledWith(owner);
		expect(res).toEqual(addrs);
	});

	it("deploy → enqueues a job and returns job info (queue-based)", async () => {
		const owner = "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a" as Address;
		queue.enqueue.mockResolvedValue(
			"300:0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
		);

		const res = await controller.deploy(owner);

		expect(queue.enqueue).toHaveBeenCalledWith(owner, 300);
		expect(res).toEqual({
			jobId: "300:0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
			statusUrl: "/contract/jobs/300:0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
		});

		expect(service.deployContractForOwner).not.toHaveBeenCalled();
	});
});

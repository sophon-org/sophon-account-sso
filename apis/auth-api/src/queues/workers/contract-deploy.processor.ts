import { Processor, WorkerHost } from "@nestjs/bullmq";
import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { ContractService } from "src/me/contract.service";
import { Address } from "viem";
import { CONTRACT_DEPLOY_QUEUE } from "../queue.constants";
import type { DeployJobData, DeployJobResult } from "../types";

@Injectable()
@Processor(CONTRACT_DEPLOY_QUEUE)
export class ContractDeployProcessor extends WorkerHost {
	private readonly logger = new Logger(ContractDeployProcessor.name);

	constructor(
		@Inject(forwardRef(() => ContractService))
		private readonly contractService: ContractService,
	) {
		super();
	}

	async process(
		job: Job<DeployJobData, DeployJobResult>,
	): Promise<DeployJobResult> {
		const { owner } = job.data;
		this.logger.log({
			evt: "queue.contract.deploy.start",
			jobId: job.id,
			owner,
		});

		const res = await this.contractService.deployContractForOwner(
			owner as Address,
		);

		this.logger.log({
			evt: "queue.contract.deploy.success",
			jobId: job.id,
			owner,
			res,
		});
		return res;
	}
}

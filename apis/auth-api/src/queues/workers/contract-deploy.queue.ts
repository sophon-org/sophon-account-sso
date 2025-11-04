// src/queues/workers/contract-deploy.queue.ts
import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue, JobsOptions, Job } from "bullmq";
import { CONTRACT_DEPLOY_QUEUE } from "../queue.constants";
import type { DeployJobData, DeployJobResult } from "../types";
import type { Address } from "viem";

function makeJobId(chainId: number, owner: string) {
	return `deploy_${chainId}_${owner.toLowerCase()}`;
}

@Injectable()
export class ContractDeployQueue {
	constructor(
		@InjectQueue(CONTRACT_DEPLOY_QUEUE)
		private readonly queue: Queue<DeployJobData, DeployJobResult>,
	) {}

	async enqueue(owner: Address, chainId: number) {
		const jobId = makeJobId(chainId, owner);
		const opts: JobsOptions = {
			jobId,
			attempts: 3,
			backoff: { type: "exponential", delay: 5000 },
			removeOnComplete: { age: 86400, count: 1000 },
			removeOnFail: { age: 259200 },
		};
		const job = await this.queue.add("deploy", { owner, chainId }, opts);
		return job.id as string;
	}

	getJob(id: string): Promise<Job<DeployJobData, DeployJobResult> | undefined> {
		return this.queue.getJob(id);
	}
}

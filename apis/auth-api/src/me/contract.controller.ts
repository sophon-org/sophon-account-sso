import { Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import {
	ApiAcceptedResponse,
	ApiOkResponse,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";
import { ContractDeployQueue } from "src/queues/workers/contract-deploy.queue";
import type { Address } from "viem";
import { ContractService } from "./contract.service";

@ApiTags("Smart Contract")
@Controller("contract")
export class ContractController {
	constructor(
		private readonly contractService: ContractService,
		private readonly deployQueue: ContractDeployQueue,
	) {}

	@Get("by-owner/:owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) signer of the contract",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiOkResponse({ type: String, isArray: true })
	async byOwner(@Param("owner") owner: Address): Promise<Address[]> {
		return this.contractService.getContractByOwner(owner);
	}

	@Post(":owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) to deploy smart contract as signer",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiAcceptedResponse({
		schema: {
			type: "object",
			properties: {
				jobId: { type: "string" },
				statusUrl: { type: "string" },
			},
		},
	})
	@Post(":owner")
	@HttpCode(202)
	async deploy(@Param("owner") owner: Address) {
		const chainId = Number(process.env.CHAIN_ID);
		const jobId = `deploy_${chainId}_${owner.toLowerCase()}`;

		const existing = await this.deployQueue.getJob(jobId);
		if (existing) {
			return {
				jobId,
				statusUrl: `/contract/jobs/${encodeURIComponent(jobId)}`,
			};
		}

		const enqueued = await this.deployQueue.enqueue(owner, chainId);
		return {
			jobId: enqueued,
			statusUrl: `/contract/jobs/${encodeURIComponent(enqueued)}`,
		};
	}
	@Get("jobs/:id")
	@ApiOkResponse({
		schema: {
			type: "object",
			properties: {
				id: { type: "string" },
				state: {
					type: "string",
					enum: ["waiting", "active", "delayed", "completed", "failed"],
				},
				progress: { type: "number" },
				result: { $ref: "#/components/schemas/ContractDeployResponse" },
				failedReason: { type: "string" },
				timestamp: { type: "number" },
				finishedOn: { type: "number" },
			},
		},
	})
	async getJob(@Param("id") id: string) {
		const job = await this.deployQueue.getJob(id);
		if (!job) {
			return { id, state: "not_found" };
		}
		const state = await job.getState();
		return {
			id: job.id,
			state,
			progress: job.progress as number,
			result: job.returnvalue,
			failedReason: job.failedReason,
			timestamp: job.timestamp,
			finishedOn: job.finishedOn ?? null,
		};
	}
}

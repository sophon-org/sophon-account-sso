import {
	BadRequestException,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Query,
} from "@nestjs/common";
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { isChainId } from "@sophon-labs/account-core";
import type { Address } from "viem";
import { ContractService } from "./contract.service";
import { ContractDeployResponse } from "./dto/contract-deploy-response.dto";

@ApiTags("Smart Contract")
@Controller("contract")
export class ContractController {
	constructor(private readonly contractService: ContractService) {}

	@Get("by-owner/:owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) signer of the contract",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiQuery({
		name: "chainId",
		description:
			"Chain ID to query contracts on (defaults to CHAIN_ID env var if not provided)",
		example: 50104,
		required: false, // Optional for backward compatibility
	})
	@ApiOkResponse({ type: String, isArray: true })
	async byOwner(
		@Param("owner") owner: Address,
		@Query("chainId", ParseIntPipe) chainId?: number,
	): Promise<Address[]> {
		const effectiveChainId = chainId ?? Number(process.env.CHAIN_ID);
		if (!isChainId(effectiveChainId)) {
			throw new BadRequestException({ error: "invalid chain ID" });
		}
		return this.contractService.getContractByOwner(owner, effectiveChainId);
	}

	@Post(":owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) to deploy smart contract as signer",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiQuery({
		name: "chainId",
		description:
			"Chain ID to deploy contract on (defaults to CHAIN_ID env var if not provided)",
		example: 50104,
		required: false, // Optional for backward compatibility
	})
	@ApiOkResponse({ type: ContractDeployResponse })
	async deploy(
		@Param("owner") owner: Address,
		@Query("chainId", ParseIntPipe) chainId?: number,
	) {
		const effectiveChainId = chainId ?? Number(process.env.CHAIN_ID);
		if (!isChainId(effectiveChainId)) {
			throw new BadRequestException({ error: "invalid chain ID" });
		}
		return this.contractService.deployContractForOwner(owner, effectiveChainId);
	}
}

import {
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Query,
} from "@nestjs/common";
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
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
		description: "Chain ID to query contracts on",
		example: "50104",
		required: true,
	})
	@ApiOkResponse({ type: String, isArray: true })
	async byOwner(
		@Param("owner") owner: Address,
		@Query("chainId", ParseIntPipe) chainId: number,
	): Promise<Address[]> {
		return this.contractService.getContractByOwner(owner, chainId);
	}

	@Post(":owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) to deploy smart contract as signer",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiQuery({
		name: "chainId",
		description: "Chain ID to deploy contract on",
		example: 50104,
		required: true,
	})
	@ApiOkResponse({ type: ContractDeployResponse })
	async deploy(
		@Param("owner") owner: Address,
		@Query("chainId", ParseIntPipe) chainId: number,
	) {
		return this.contractService.deployContractForOwner(owner, chainId);
	}
}

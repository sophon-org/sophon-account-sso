import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress } from "class-validator";
import type { Address } from "viem";

export class ContractDeployResponse {
	@ApiProperty()
	@IsEthereumAddress()
	contracts: Address[];

	@ApiProperty()
	@IsEthereumAddress()
	owner: Address;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress } from "class-validator";
import type { Address } from "viem";

export class ContractDeployResponse {
	@ApiProperty()
	@IsEthereumAddress()
	address: Address;

	@ApiProperty()
	@IsEthereumAddress()
	owner: Address;
}

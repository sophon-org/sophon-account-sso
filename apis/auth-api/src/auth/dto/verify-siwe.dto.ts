import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsEthereumAddress,
	IsObject,
	IsOptional,
	IsString,
} from "class-validator";
import type { Address, Hash, TypedDataDefinition } from "viem";

export class VerifySiweDto {
	@ApiProperty({
		type: "object",
		description: "EIP-712 typed data",
		additionalProperties: true,
	})
	@IsObject()
	typedData: TypedDataDefinition;

	@ApiProperty({ required: false })
	@IsEthereumAddress()
	@IsOptional()
	ownerAddress?: Address;

	@ApiProperty()
	@IsString()
	signature: Hash;

	@ApiProperty()
	@IsString()
	nonceToken: string;

	@ApiProperty()
	@IsString()
	address: Address;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	audience?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	contentsHash?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsBoolean()
	rememberMe?: boolean;
}

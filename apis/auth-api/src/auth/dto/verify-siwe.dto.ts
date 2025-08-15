import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";
import type { Address, Hash, TypedDataDefinition } from "viem";

export class VerifySiweDto {
	@ApiProperty({
		type: "object",
		description: "EIP-712 typed data",
		additionalProperties: true,
	})
	@IsString()
	@IsObject()
	typedData: TypedDataDefinition;

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
	@IsBoolean()
	rememberMe?: boolean;
}

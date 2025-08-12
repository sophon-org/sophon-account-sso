import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import type { Address, Hash } from "viem";

export class VerifySiweDto {
	@ApiProperty()
	@IsString()
	typedData: string;

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

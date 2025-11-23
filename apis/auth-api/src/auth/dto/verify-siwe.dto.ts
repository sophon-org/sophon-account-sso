import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	IsBoolean,
	IsEthereumAddress,
	IsInt,
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

	@ApiPropertyOptional({
		description:
			"Chain ID for the authentication request (defaults to CHAIN_ID env var if not provided)",
		example: 50104,
		examples: [50104, 531050104],
	})
	@IsOptional()
	@IsInt()
	// @IsNotEmpty() // Temporarily commented for backward compatibility
	chainId?: number;
}

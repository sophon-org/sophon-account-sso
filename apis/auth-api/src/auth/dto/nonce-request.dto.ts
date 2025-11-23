import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	ArrayMaxSize,
	IsArray,
	IsEthereumAddress,
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
} from "class-validator";
import {
	PERMISSION_ALLOWED_FIELDS,
	type PermissionAllowedField,
} from "../../config/permission-allowed-fields";

export class NonceRequestDto {
	@ApiProperty({
		example: "0x1234567890abcdef1234567890abcdef12345678",
		description: "The Ethereum address of the user",
	})
	@IsEthereumAddress()
	address!: string;

	@ApiProperty({
		example: "123b216c-678e-4611-af9a-2d5b7b061258",
		description: "Partner/audience ID",
	})
	@IsString()
	partnerId!: string;

	@ApiProperty({
		description: "Fields requested from /me",
		isArray: true,
		enum: PERMISSION_ALLOWED_FIELDS,
		enumName: "PermissionAllowedField",
		example: ["email", "x"],
	})
	@IsArray()
	@ArrayMaxSize(16)
	@IsIn(PERMISSION_ALLOWED_FIELDS as unknown as string[], { each: true })
	fields!: PermissionAllowedField[];

	@ApiPropertyOptional({
		description: "Optional external user identifier",
		example: "user_abc_123",
	})
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	userId?: string; // ← optional

	@ApiPropertyOptional({
		description: "Chain ID for the authentication request (defaults to CHAIN_ID env var if not provided)",
		example: 531050104,
		examples: [50104, 531050104],
	})
	@IsOptional()
	@IsInt()
	// @IsNotEmpty() // Temporarily commented for backward compatibility
	chainId?: number;
}

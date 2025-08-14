import { ApiProperty } from "@nestjs/swagger";
import {
	ArrayMaxSize,
	ArrayNotEmpty,
	IsArray,
	IsEthereumAddress,
	IsIn,
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
	@ArrayNotEmpty()
	@ArrayMaxSize(16)
	@IsIn(PERMISSION_ALLOWED_FIELDS as unknown as string[], { each: true })
	fields!: PermissionAllowedField[];
}

import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString } from "class-validator";

export class NonceRequestDto {
	@ApiProperty({
		example: "0x1234567890abcdef1234567890abcdef12345678",
		description: "The Ethereum address of the user",
	})
	@IsEthereumAddress()
	address!: string;

	@ApiProperty({
		example: "123b216c-678e-4611-af9a-2d5b7b061258",
		description: "Partner or audience ID",
	})
	@IsString()
	partnerId!: string;
}

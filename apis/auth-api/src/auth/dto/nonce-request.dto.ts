// src/auth/dto/nonce-request.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString } from "class-validator";

export class NonceRequestDto {
	@ApiProperty({ example: "0xabc123..." })
	@IsEthereumAddress()
	address: string;

	@ApiProperty({
		example: "my-service",
		description: "Optional audience for the nonce JWT",
	})
	@IsString()
	partnerId: string;
}

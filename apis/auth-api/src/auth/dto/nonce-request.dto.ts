// src/auth/dto/nonce-request.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress } from "class-validator";

export class NonceRequestDto {
	@ApiProperty({ example: "0xabc123..." })
	@IsEthereumAddress()
	address: string;
}

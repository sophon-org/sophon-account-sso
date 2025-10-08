import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum } from "class-validator";
import { ConsentKind } from "./consent-kind.enum";

export class RevokeManyConsentsDto {
	@ApiProperty({
		description: "List of consents to revoke",
		enum: ConsentKind,
		isArray: true,
		example: [ConsentKind.PERSONALIZATION_ADS, ConsentKind.SHARING_DATA],
	})
	@IsArray()
	@ArrayNotEmpty()
	@ArrayUnique()
	@IsEnum(ConsentKind, { each: true })
	kinds!: ConsentKind[];
}

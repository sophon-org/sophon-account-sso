import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ConsentKind } from "./consent-kind.enum";

export class GiveConsentDto {
	@ApiProperty({ enum: ConsentKind })
	@IsEnum(ConsentKind)
	kind!: ConsentKind;
}

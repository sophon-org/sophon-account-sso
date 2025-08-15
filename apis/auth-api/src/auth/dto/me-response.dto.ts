import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	PERMISSION_ALLOWED_FIELDS,
	type PermissionAllowedField,
} from "../../config/permission-allowed-fields";

export class MeFieldsDto {
	@ApiPropertyOptional({ nullable: true }) discord?: string | null;
	@ApiPropertyOptional({ nullable: true }) email?: string | null;
	@ApiPropertyOptional({ nullable: true }) google?: string | null;
	@ApiPropertyOptional({ nullable: true }) telegram?: string | null;
	@ApiPropertyOptional({ nullable: true }) x?: string | null;
}

export class MeResponseDto {
	@ApiProperty() sub!: string;
	@ApiProperty() aud!: string;
	@ApiProperty() iss!: string;

	@ApiProperty({
		description: "Granted permissions as array (from token scope)",
		isArray: true,
		enum: PERMISSION_ALLOWED_FIELDS,
	})
	scope!: PermissionAllowedField[];

	@ApiProperty({ type: MeFieldsDto })
	fields!: MeFieldsDto;

	@ApiPropertyOptional({
		description: "Token expiration (seconds since epoch)",
		nullable: true,
	})
	exp?: number;

	@ApiPropertyOptional({
		description: "Token issued-at (seconds since epoch)",
		nullable: true,
	})
	iat?: number;
}

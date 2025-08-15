import { Injectable } from "@nestjs/common";
import type { JwtPayload } from "jsonwebtoken";
import {
	type PermissionAllowedField,
	unpackScope,
} from "../config/permission-allowed-fields";
import { MeFieldsDto, MeResponseDto } from "./dto/me-response.dto";

@Injectable()
export class MeService {
	async buildMeResponse(payload: JwtPayload): Promise<MeResponseDto> {
		const scopeArr = unpackScope(
			(payload as any).scope ?? "",
		) as PermissionAllowedField[];

		const fields: MeFieldsDto = {};
		for (const f of scopeArr) {
			fields[f] = await this.resolveField(f, payload.sub as string);
		}

		return {
			sub: (payload.sub as string) ?? "",
			aud: (payload.aud as string) ?? "",
			iss: (payload.iss as string) ?? "",
			scope: scopeArr,
			fields,
			exp: typeof payload.exp === "number" ? payload.exp : undefined,
			iat: typeof payload.iat === "number" ? payload.iat : undefined,
		};
	}

	private async resolveField(
		field: PermissionAllowedField,
		subject: string,
	): Promise<string | null> {
		// TODO: wire up your data sources. For now, return nulls.
		switch (field) {
			case "email":
				// return await this.users.getEmailBySub(subject);
				return null;
			case "discord":
			case "google":
			case "telegram":
			case "x":
			default:
				return null;
		}
	}
}

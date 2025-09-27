import {
	BadRequestException,
	Controller,
	Get,
	Param,
	UseGuards,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOkResponse,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { K1OwnerStateDto } from "./dto/k1-owner-state.dto";
import { HyperindexService } from "./hyperindex.service";

function normalizeAddress(s: string | undefined | null): `0x${string}` {
	const v = (s ?? "").trim().toLowerCase();
	if (!/^0x[0-9a-f]{40}$/.test(v)) {
		throw new BadRequestException("Invalid address");
	}
	return v as `0x${string}`;
}

@ApiTags("Me")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller("me")
export class MeController {
	constructor(private readonly hyperindex: HyperindexService) {}

	/**
	 * New form: explicit EOA argument (preferred).
	 * GET /me/k1-owner-state/:owner
	 */
	@Get("k1-owner-state/:owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) to fetch K1 owner state for",
		example: "0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a",
	})
	@ApiOkResponse({ type: K1OwnerStateDto, isArray: true })
	async k1OwnerStateForOwner(@Param("owner") owner: string) {
		const address = normalizeAddress(owner);
		return this.hyperindex.getK1OwnerStateByOwner(address);
	}
}

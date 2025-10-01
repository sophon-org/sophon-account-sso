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
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
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
	constructor(
		private readonly hyperindex: HyperindexService,
		@InjectPinoLogger(MeController.name)
		private readonly logger: PinoLogger,
	) {}

	@Get("k1-owner-state/:owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) to fetch K1 owner state for",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiOkResponse({ type: K1OwnerStateDto, isArray: true })
	async k1OwnerStateForOwner(@Param("owner") owner: string) {
		const address = normalizeAddress(owner);
		this.logger.info(
			{ evt: "me.k1_owner_state.request", owner: address },
			"k1-owner-state",
		);
		const rows = await this.hyperindex.getK1OwnerStateByOwner(address);
		this.logger.info(
			{ evt: "me.k1_owner_state.success", owner: address, total: rows.length },
			"k1-owner-state",
		);
		return rows;
	}
}

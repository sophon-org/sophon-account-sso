import {
	Controller,
	Get,
	Req,
	UnauthorizedException,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import type { AccessTokenPayload } from "../auth/types";
import { K1OwnerStateDto } from "./dto/k1-owner-state.dto";
import { HyperindexService } from "./hyperindex.service";

function requireAddress(
	user: AccessTokenPayload & { sub?: string },
): `0x${string}` {
	const addr = user?.sub?.toLowerCase();
	if (!addr || !/^0x[0-9a-f]{40}$/.test(addr)) {
		throw new UnauthorizedException("Invalid or missing subject address");
	}
	return addr as `0x${string}`;
}

@ApiTags("Me")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller("me")
export class MeController {
	constructor(private readonly hyperindex: HyperindexService) {}

	@Get("k1-owner-state")
	@ApiOkResponse({ type: K1OwnerStateDto, isArray: true })
	async myK1OwnerState(@Req() req: Request) {
		const { user } = req as Request & { user: AccessTokenPayload };
		const address = requireAddress(user);
		return this.hyperindex.getK1OwnerStateByOwner(address);
	}
}

import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { GiveManyConsentsDto } from "src/consents/dto/give-many-consents.dto";
import { RevokeManyConsentsDto } from "src/consents/dto/revoke-many-consents.dto";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import type { AccessTokenPayload } from "../auth/types";
import { ConsentsService } from "../consents/consents.service";
import { ConsentKind } from "../consents/dto/consent-kind.enum";
import { GiveConsentDto } from "../consents/dto/give-consent.dto";

function requireSubFromReq(
	req: Request & { user?: AccessTokenPayload },
): string {
	const u = req.user as AccessTokenPayload & { sub?: string };
	const sub = u?.sub;
	if (!sub) {
		throw new BadRequestException(
			"sub is required in JWT for consent operations",
		);
	}
	return sub.toLowerCase();
}

@ApiTags("Me")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller("me/consent")
export class ConsentController {
	constructor(
		private readonly consents: ConsentsService,
		@InjectPinoLogger(ConsentController.name)
		private readonly logger: PinoLogger,
	) {}
	@Get()
	@ApiOkResponse({ description: "List active consents for current user" })
	async list(@Req() req: Request & { user: AccessTokenPayload }) {
		const sub = requireSubFromReq(req);
		const rows = await this.consents.getActiveConsents(sub);
		this.logger.info(
			{ evt: "me.consents.list", sub, total: rows.length },
			"active consents",
		);
		return rows.map((r) => ({
			kind: r.kind,
			startTime: r.startTime.toISOString(),
		}));
	}

	@Post()
	@ApiOkResponse({ description: "Give consent of a kind" })
	async give(
		@Body() dto: GiveConsentDto,
		@Req() req: Request & { user: AccessTokenPayload },
	) {
		const sub = requireSubFromReq(req);
		const row = await this.consents.give(sub, dto.kind);
		this.logger.info(
			{ evt: "me.consents.give", sub, kind: dto.kind },
			"consent granted",
		);
		return { kind: row.kind, startTime: row.startTime.toISOString() };
	}

	@Post("giveMany")
	@ApiOkResponse({ description: "Give multiple consents in one call" })
	async giveMany(
		@Body() dto: GiveManyConsentsDto,
		@Req() req: Request & { user: AccessTokenPayload },
	) {
		const sub = requireSubFromReq(req);
		const rows = await this.consents.giveMany(sub, dto.kinds);
		this.logger.info(
			{
				evt: "me.consents.giveMany",
				sub,
				kinds: dto.kinds,
				total: rows.length,
			},
			"consents granted",
		);
		return rows.map((r) => ({
			kind: r.kind,
			startTime: r.startTime.toISOString(),
		}));
	}

	@Delete(":kind")
	@ApiOkResponse({ description: "Revoke consent of a kind" })
	async revoke(
		@Param("kind") kind: ConsentKind,
		@Req() req: Request & { user: AccessTokenPayload },
	) {
		const sub = requireSubFromReq(req);
		const changed = await this.consents.revoke(sub, kind);
		this.logger.info(
			{ evt: "me.consents.revoke", sub, kind, changed },
			"consent revoked",
		);
		return { ok: true, changed };
	}

	@Post("revokeMany")
	@ApiOkResponse({ description: "Revoke multiple consents in one call" })
	async revokeMany(
		@Body() dto: RevokeManyConsentsDto,
		@Req() req: Request & { user: AccessTokenPayload },
	) {
		const sub = requireSubFromReq(req);
		const { changed } = await this.consents.revokeMany(sub, dto.kinds);
		this.logger.info(
			{ evt: "me.consents.revokeMany", sub, kinds: dto.kinds, changed },
			"consents revoked",
		);
		return { ok: true, changed };
	}
}

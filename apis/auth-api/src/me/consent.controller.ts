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
import {
	ApiBearerAuth,
	ApiOkResponse,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { GiveManyConsentsDto } from "src/consents/dto/give-many-consents.dto";
import { RevokeManyConsentsDto } from "src/consents/dto/revoke-many-consents.dto";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import type { AccessTokenPayload } from "../auth/types";
import { ConsentsService } from "../consents/consents.service";
import { ConsentKind } from "../consents/dto/consent-kind.enum";
import { GiveConsentDto } from "../consents/dto/give-consent.dto";

function requireUserIdFromReq(
	req: Request & { user?: AccessTokenPayload },
): string {
	const u = req.user as AccessTokenPayload & { userId?: string; sub?: string };
	const userId = u?.userId;
	if (!userId) {
		throw new BadRequestException(
			"userId is required in JWT for consent operations",
		);
	}
	return userId;
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
		const userId = requireUserIdFromReq(req);
		const rows = await this.consents.getActiveConsents(userId);
		this.logger.info(
			{ evt: "me.consents.list", userId, total: rows.length },
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
		const userId = requireUserIdFromReq(req);
		const row = await this.consents.give(userId, dto.kind);
		this.logger.info(
			{ evt: "me.consents.give", userId, kind: dto.kind },
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
		const userId = requireUserIdFromReq(req);
		const rows = await this.consents.giveMany(userId, dto.kinds);
		this.logger.info(
			{
				evt: "me.consents.giveMany",
				userId,
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
	@ApiParam({ name: "kind", enum: ConsentKind })
	@ApiOkResponse({ description: "Revoke consent of a kind" })
	async revoke(
		@Param("kind") kind: ConsentKind,
		@Req() req: Request & { user: AccessTokenPayload },
	) {
		const userId = requireUserIdFromReq(req);
		const changed = await this.consents.revoke(userId, kind);
		this.logger.info(
			{ evt: "me.consents.revoke", userId, kind, changed },
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
		const userId = requireUserIdFromReq(req);
		const { changed } = await this.consents.revokeMany(userId, dto.kinds);
		this.logger.info(
			{ evt: "me.consents.revokeMany", userId, kinds: dto.kinds, changed },
			"consents revoked",
		);
		return { ok: true, changed };
	}
}

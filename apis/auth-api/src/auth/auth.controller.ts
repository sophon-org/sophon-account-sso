import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiBody,
	ApiCookieAuth,
	ApiOkResponse,
	ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { getChainById } from "src/utils/chain";
import { extractRefreshToken } from "../utils/token-extractor";
import { AuthService } from "./auth.service";
import { NonceRequestDto } from "./dto/nonce-request.dto";
import { VerifySiweDto } from "./dto/verify-siwe.dto";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { MeService } from "./me.service";
import { AuthenticatedRequest } from "./types";

const clientInfo = (req: Request) => {
	const h = req.headers;
	const direct =
		(h["cf-connecting-ip"] as string) ||
		(h["true-client-ip"] as string) ||
		(h["x-client-ip"] as string) ||
		(h["x-real-ip"] as string);
	const xff = (h["x-forwarded-for"] as string | undefined)
		?.split(",")[0]
		?.trim();
	const rawIp = direct || xff || req.ip || req.socket?.remoteAddress || "";
	const ip = rawIp.replace(/^::ffff:/, "");
	const ua = (h["user-agent"] as string) || "";
	const userAgent = ua.length > 1024 ? ua.slice(0, 1024) : ua;
	return { ip, userAgent };
};

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly meService: MeService,
		@InjectPinoLogger(AuthController.name)
		private readonly logger: PinoLogger,
	) {}

	@Post("nonce")
	@ApiBody({ type: NonceRequestDto, required: true })
	@ApiOkResponse({ description: "Returns signed nonce JWT" })
	async getNonce(@Body() body: NonceRequestDto, @Res() res: Response) {
		const effectiveChainId = body.chainId ?? Number(process.env.CHAIN_ID);
		if (
			effectiveChainId == null ||
			Number.isNaN(effectiveChainId) ||
			getChainById(effectiveChainId) == null
		) {
			this.logger.warn(
				{
					evt: "auth.nonce.invalid_chain_id",
					address: body.address,
					partnerId: body.partnerId,
					chainId: effectiveChainId,
				},
				"invalid chain ID",
			);
			throw new BadRequestException({ error: "invalid chain ID" });
		}
		this.logger.info(
			{
				evt: "auth.nonce.request",
				address: body.address,
				partnerId: body.partnerId,
				fieldsCount: body.fields?.length ?? 0,
				hasUserId: Boolean(body.userId),
				chainId: effectiveChainId,
			},
			"nonce requested",
		);

		const token = await this.authService.generateNonceTokenForAddress(
			body.address,
			body.partnerId,
			body.fields,
			body.userId,
			effectiveChainId,
		);

		this.logger.debug({ evt: "auth.nonce.issued" }, "nonce issued");
		return res.json({ nonce: token });
	}

	@Post("verify")
	@ApiBody({ type: VerifySiweDto, required: true })
	@ApiOkResponse({
		description: "Sets cookies and returns access token (for API clients)",
	})
	async verifySignature(
		@Body() body: VerifySiweDto,
		@Res() res: Response,
		@Req() req: Request,
	) {
		const effectiveChainId = body.chainId ?? Number(process.env.CHAIN_ID);

		if (
			effectiveChainId == null ||
			Number.isNaN(effectiveChainId) ||
			getChainById(effectiveChainId) == null
		) {
			this.logger.warn(
				{
					evt: "auth.verify.invalid_chain_id",
					address: body.address,
					chainId: effectiveChainId,
				},
				"invalid chain ID",
			);
			throw new BadRequestException({ error: "invalid chain ID" });
		}

		const ci = clientInfo(req);
		this.logger.info(
			{
				evt: "auth.verify.attempt",
				address: body.address,
				chainId: effectiveChainId,
				hasTypedData: Boolean(body.typedData),
				hasSignature: Boolean(body.signature),
				hasNonce: Boolean(body.nonceToken),
				ip: ci.ip,
			},
			"verify attempt",
		);

		try {
			const {
				accessToken,
				accessTokenExpiresAt,
				refreshToken,
				refreshTokenExpiresAt,
				sid,
			} = await this.authService.verifySignatureWithSiweIssueTokens(
				body.address,
				body.typedData,
				body.signature,
				body.nonceToken,
				effectiveChainId,
				ci,
				body.ownerAddress,
				body.audience,
				body.contentsHash,
			);

			this.logger.info(
				{
					evt: "auth.verify.success",
					address: body.address,
					chainId: effectiveChainId,
					sid,
					accessTokenExp: accessTokenExpiresAt,
					refreshTokenExp: refreshTokenExpiresAt,
				},
				"verify success",
			);

			res
				.cookie("access_token", accessToken, this.authService.cookieOptions())
				.cookie(
					"refresh_token",
					refreshToken,
					this.authService.refreshCookieOptions(),
				);

			return res.json({
				accessToken,
				refreshToken,
				accessTokenExpiresAt,
				refreshTokenExpiresAt,
			});
		} catch (err) {
			this.logger.warn(
				{ evt: "auth.verify.failed", address: body.address, ip: ci.ip, err },
				"verify failed",
			);
			throw new UnauthorizedException({ error: "verification failed" });
		}
	}

	@Post("refresh")
	@ApiCookieAuth("refresh_token")
	@ApiOkResponse({ description: "Rotates access and refresh tokens" })
	async refresh(@Req() req: Request, @Res() res: Response) {
		const ci = clientInfo(req);
		const rt = extractRefreshToken(req);
		if (!rt) {
			this.logger.warn(
				{ evt: "auth.refresh.missing", ip: ci.ip },
				"missing refresh token",
			);
			throw new UnauthorizedException({ error: "missing refresh token" });
		}

		try {
			const {
				accessToken,
				refreshToken,
				accessTokenExpiresAt,
				refreshTokenExpiresAt,
			} = await this.authService.refresh(rt, ci);

			this.logger.info(
				{
					evt: "auth.refresh.success",
					ip: ci.ip,
					accessTokenExp: accessTokenExpiresAt,
					refreshTokenExp: refreshTokenExpiresAt,
				},
				"refresh success",
			);

			res
				.cookie("access_token", accessToken, this.authService.cookieOptions())
				.cookie(
					"refresh_token",
					refreshToken,
					this.authService.refreshCookieOptions(),
				);

			return res.json({
				accessToken,
				accessTokenExpiresAt,
				refreshToken,
				refreshTokenExpiresAt,
			});
		} catch (err) {
			this.logger.warn(
				{ evt: "auth.refresh.failed", ip: ci.ip, err },
				"refresh failed",
			);
			throw new UnauthorizedException({ error: "Unable to refresh token" });
		}
	}

	@Post("logout")
	@ApiOkResponse({ description: "Clears JWT cookies" })
	async logout(@Req() req: Request, @Res() res: Response) {
		const ci = clientInfo(req);
		const rt = extractRefreshToken(req);

		if (rt) {
			await this.authService.revokeByRefreshToken(rt).catch(() => {});
			this.logger.info(
				{ evt: "auth.logout.revoked", ip: ci.ip },
				"revoked by refresh token",
			);
		} else {
			this.logger.info(
				{ evt: "auth.logout.no_rt", ip: ci.ip },
				"logout without refresh token",
			);
		}

		res
			.clearCookie("access_token", {
				...this.authService.cookieOptions(),
				maxAge: 0,
			})
			.clearCookie("refresh_token", {
				...this.authService.refreshCookieOptions(),
				maxAge: 0,
			});

		return res.status(200).json({ ok: true });
	}

	@Get("me")
	@UseGuards(AccessTokenGuard)
	@ApiCookieAuth("access_token")
	@ApiBearerAuth()
	@ApiOkResponse({ description: "Returns identity and requested fields" })
	async me(@Req() req: AuthenticatedRequest) {
		const { user } = req;
		this.logger.debug(
			{ evt: "auth.me", sub: user.sub, partnerId: user.aud },
			"me requested",
		);
		return this.meService.buildMeResponse(user);
	}

	@Get("sessions")
	@UseGuards(AccessTokenGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ description: "Lists active sessions for the current user" })
	async listSessions(@Req() req: AuthenticatedRequest) {
		const { user } = req;
		const aud = user.aud;

		const sessions = await this.authService.listActiveSessionsForSub(
			user.sub,
			aud,
		);

		this.logger.info(
			{
				evt: "auth.sessions.list",
				aud,
				total: sessions.length,
				currentSid: user.sid ?? null,
			},
			"sessions listed",
		);

		return sessions.map((s) => ({
			sid: s.sid,
			aud: s.aud,
			createdAt: s.createdAt.toISOString(),
			refreshExpiresAt: s.refreshExpiresAt.toISOString(),
			createdIp: s.createdIp ?? null,
			createdUserAgent: s.createdUserAgent ?? null,
			current: user.sid ? user.sid === s.sid : false,
		}));
	}
	@Delete("sessions/:sid")
	@UseGuards(AccessTokenGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ description: "Revokes the specified session" })
	async revokeOne(
		@Param("sid") sid: string,
		@Req() req: AuthenticatedRequest,
		@Res() res: Response,
	) {
		const { user } = req;

		await this.authService.revokeSessionForSub(user.sub, sid);

		const isCurrent = Boolean(user.sid && user.sid === sid);
		this.logger.info(
			{ evt: "auth.sessions.revoke", sub: user.sub, sid, isCurrent },
			"session revoked",
		);

		if (isCurrent) {
			res
				.clearCookie("access_token", {
					...this.authService.cookieOptions(),
					maxAge: 0,
				})
				.clearCookie("refresh_token", {
					...this.authService.refreshCookieOptions(),
					maxAge: 0,
				});
		}
		return res.json({ ok: true });
	}
}

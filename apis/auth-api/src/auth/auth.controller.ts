import {
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
import { extractRefreshToken } from "../utils/token-extractor";
import { AuthService } from "./auth.service";
import { NonceRequestDto } from "./dto/nonce-request.dto";
import { VerifySiweDto } from "./dto/verify-siwe.dto";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { MeService } from "./me.service";
import { AccessTokenPayload } from "./types";

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

function requireUserId(
	user: AccessTokenPayload & { userId?: string; sub?: string },
): string {
	const id = user.userId ?? user.sub;
	if (!id) {
		throw new UnauthorizedException("missing subject/userId in token");
	}
	return id;
}

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly meService: MeService,
	) {}

	@Post("nonce")
	@ApiBody({ type: NonceRequestDto, required: true })
	@ApiOkResponse({ description: "Returns signed nonce JWT" })
	async getNonce(@Body() body: NonceRequestDto, @Res() res: Response) {
		const token = await this.authService.generateNonceTokenForAddress(
			body.address,
			body.partnerId,
			body.fields,
			body.userId,
		);
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
		try {
			const {
				accessToken,
				accessTokenExpiresAt,
				refreshToken,
				refreshTokenExpiresAt,
			} = await this.authService.verifySignatureWithSiweIssueTokens(
				body.address,
				body.typedData,
				body.signature,
				body.nonceToken,
				clientInfo(req),
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
		} catch (_err: unknown) {
			console.error(_err);
			throw new UnauthorizedException({ error: "verification failed" });
		}
	}

	@Post("refresh")
	@ApiCookieAuth("refresh_token")
	@ApiOkResponse({ description: "Rotates access and refresh tokens" })
	async refresh(@Req() req: Request, @Res() res: Response) {
		const rt = extractRefreshToken(req);
		if (!rt) {
			throw new UnauthorizedException({ error: "missing refresh token" });
		}

		try {
			const {
				accessToken,
				refreshToken,
				accessTokenExpiresAt,
				refreshTokenExpiresAt,
			} = await this.authService.refresh(rt, clientInfo(req));

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
			console.error(err);
			throw new UnauthorizedException({ error: "Unable to refresh token" });
		}
	}

	@Post("logout")
	@ApiOkResponse({ description: "Clears JWT cookies" })
	async logout(@Req() req: Request, @Res() res: Response) {
		const rt = extractRefreshToken(req);
		if (rt) {
			await this.authService.revokeByRefreshToken(rt).catch(() => {});
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
	async me(@Req() req: Request) {
		const { user } = req as Request & { user: AccessTokenPayload };
		return this.meService.buildMeResponse(user);
	}

	@Get("sessions")
	@UseGuards(AccessTokenGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ description: "Lists active sessions for the current user" })
	async listSessions(@Req() req: Request) {
		const { user } = req as Request & {
			user: AccessTokenPayload & {
				sid?: string;
				userId?: string;
				sub?: string;
			};
		};
		const userId = requireUserId(user);
		const aud = user.aud;

		const sessions = await this.authService.listActiveSessionsForUser(
			userId,
			aud,
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
		@Req() req: Request,
		@Res() res: Response,
	) {
		const { user } = req as Request & {
			user: AccessTokenPayload & {
				sid?: string;
				userId?: string;
				sub?: string;
			};
		};
		const userId = requireUserId(user);

		await this.authService.revokeSessionForUser(userId, sid);

		if (user.sid && user.sid === sid) {
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

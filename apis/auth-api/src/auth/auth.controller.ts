import {
	Body,
	Controller,
	Get,
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
import { AuthService } from "./auth.service";
import { NonceRequestDto } from "./dto/nonce-request.dto";
import { VerifySiweDto } from "./dto/verify-siwe.dto";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { MeService } from "./me.service";
import { AccessTokenPayload } from "./types";
import { extractRefreshToken } from "../utils/token-extractor";

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
	async verifySignature(@Body() body: VerifySiweDto, @Res() res: Response) {
		try {
			const { accessToken, refreshToken } =
				await this.authService.verifySignatureWithSiweIssueTokens(
					body.address,
					body.typedData,
					body.signature,
					body.nonceToken,
				);

			res
				.cookie("access_token", accessToken, this.authService.cookieOptions())
				.cookie(
					"refresh_token",
					refreshToken,
					this.authService.refreshCookieOptions(),
				);

			return res.json({ token: accessToken });
		} catch (_err: unknown) {
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
			const { accessToken, refreshToken } = await this.authService.refresh(rt);

			res
				.cookie("access_token", accessToken, this.authService.cookieOptions())
				.cookie(
					"refresh_token",
					refreshToken,
					this.authService.refreshCookieOptions(),
				);

			return res.json({ token: accessToken });
		} catch (_err: unknown) {
			throw new UnauthorizedException({ error: "invalid refresh token" });
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
}

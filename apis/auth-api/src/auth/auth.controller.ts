import {
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res,
	UseGuards,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiBody,
	ApiCookieAuth,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { NonceRequestDto } from "./dto/nonce-request.dto";
import { VerifySiweDto } from "./dto/verify-siwe.dto";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { MeService } from "./me.service";
import { AccessTokenPayload } from "./types";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly meService: MeService,
	) {}

	@Post("nonce")
	@ApiBody({ type: NonceRequestDto, required: true })
	@ApiResponse({ status: 200, description: "Returns signed nonce JWT" })
	async getNonce(@Body() body: NonceRequestDto, @Res() res: Response) {
		const token = await this.authService.generateNonceTokenForAddress(
			body.address,
			body.partnerId,
			body.fields,
			body.userId,
		);
		res.json({ nonce: token });
	}

	@Post("verify")
	@ApiBody({ type: VerifySiweDto, required: true })
	@ApiResponse({ status: 200, description: "Sets JWT cookie if verified" })
	async verifySignature(@Body() body: VerifySiweDto, @Res() res: Response) {
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
			)
			.json({ token: accessToken });
	}

	@Post("refresh")
	@ApiResponse({
		status: 200,
		description: "Rotates access and refresh tokens",
	})
	async refresh(@Req() req: Request, @Res() res: Response) {
		const fromCookie = (req as Request & { cookies?: Record<string, string> })
			.cookies?.refresh_token as string | undefined;
		const fromAuth = req.headers.authorization?.startsWith("Bearer ")
			? req.headers.authorization.slice("Bearer ".length)
			: undefined;
		const rt = fromCookie ?? fromAuth;
		if (!rt) {
			res.status(401).json({ error: "missing refresh token" });
			return;
		}
		const { accessToken, refreshToken } = await this.authService.refresh(rt);
		res
			.cookie("access_token", accessToken, this.authService.cookieOptions())
			.cookie(
				"refresh_token",
				refreshToken,
				this.authService.refreshCookieOptions(),
			)
			.json({ token: accessToken });
	}

	@Post("logout")
	@ApiResponse({ status: 200, description: "Clears JWT cookie" })
	logout(@Res() res: Response) {
		res
			.clearCookie("access_token", {
				...this.authService.cookieOptions(),
				maxAge: 0,
			})
			.clearCookie("refresh_token", {
				...this.authService.refreshCookieOptions(),
				maxAge: 0,
			})
			.status(200)
			.json({ ok: true });
	}

	@Get("me")
	@UseGuards(AccessTokenGuard)
	@ApiCookieAuth("access_token")
	@ApiBearerAuth()
	@ApiResponse({
		status: 200,
		description: "Returns identity and requested fields",
	})
	async me(@Req() req: Request) {
		const { user } = req as Request & { user: AccessTokenPayload };
		return this.meService.buildMeResponse(user);
	}
}

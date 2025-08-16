import {
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res,
	UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiCookieAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
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
		const accessToken = await this.authService.verifySignatureWithSiwe(
			body.address,
			body.typedData,
			body.signature,
			body.nonceToken,
			body.rememberMe ?? false,
		);
		res.cookie(
			"access_token",
			accessToken,
			this.authService.cookieOptions(body.rememberMe),
		);
		res.json({ token: accessToken });
	}

	@Post("logout")
	@ApiResponse({ status: 200, description: "Clears JWT cookie" })
	logout(@Res() res: Response) {
		res.clearCookie("access_token", {
			...this.authService.cookieOptions(),
			maxAge: 0,
		});
		res.status(200).json({ ok: true });
	}

	@Get("me")
	@UseGuards(AccessTokenGuard)
	@ApiCookieAuth("access_token")
	@ApiResponse({
		status: 200,
		description: "Returns identity and requested fields",
	})
	async me(@Req() req: Request) {
		const { user } = req as Request & { user: AccessTokenPayload };
		return this.meService.buildMeResponse(user);
	}
}

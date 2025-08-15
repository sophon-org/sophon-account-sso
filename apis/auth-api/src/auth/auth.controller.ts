import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request as ExpressRequest, Response } from "express";
import { AuthService } from "./auth.service";
import { NonceRequestDto } from "./dto/nonce-request.dto";
import { VerifySiweDto } from "./dto/verify-siwe.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("nonce")
	@ApiBody({ type: NonceRequestDto, required: true })
	@ApiResponse({ status: 200, description: "Returns signed nonce JWT" })
	async getNonce(@Body() body: NonceRequestDto, @Res() res: Response) {
		const token = await this.authService.generateNonceTokenForAddress(
			body.address,
			body.partnerId,
			body.fields,
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

	@Post("me")
	async me(@Req() req: ExpressRequest, @Res() res: Response) {
		const token = req.cookies?.access_token;
		if (!token) return res.status(401).json({ error: "Unauthorized" });

		try {
			const payload = await this.authService.verifyAccessToken(token);
			res.json(payload);
		} catch {
			res.status(401).json({ error: "Invalid or expired token" });
		}
	}
}

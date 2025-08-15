import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth.service";

@Injectable()
export class AccessTokenGuard implements CanActivate {
	constructor(private readonly auth: AuthService) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const req = ctx.switchToHttp().getRequest<Request>();
		const cookieToken = req.cookies?.access_token as string | undefined;
		const bearer = req.headers.authorization?.startsWith("Bearer ")
			? req.headers.authorization.slice(7)
			: undefined;

		const token = cookieToken ?? bearer;
		if (!token) throw new UnauthorizedException("missing access token");

		// Verify & attach payload for handler
		const payload = await this.auth.verifyAccessToken(token);
		(req as any).user = payload;
		return true;
	}
}

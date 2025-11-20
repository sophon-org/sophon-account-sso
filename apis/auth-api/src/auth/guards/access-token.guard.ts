import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth.service";
import type { AccessTokenPayload } from "../types";
@Injectable()
export class AccessTokenGuard implements CanActivate {
	constructor(private readonly auth: AuthService) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const req = ctx.switchToHttp().getRequest<Request>();
		const cookieToken = req.cookies?.access_token as string | undefined;
		const rawAuthz = req.headers.authorization;
		const authz = Array.isArray(rawAuthz) ? rawAuthz[0] : rawAuthz;
		const bearer = authz?.toLowerCase().startsWith("bearer ")
			? authz.slice(7)
			: undefined;

		const token = cookieToken ?? bearer;
		if (!token) throw new UnauthorizedException("missing access token");

		const payload = await this.auth.verifyAccessToken(token);
		(req as Request & { user: AccessTokenPayload }).user = payload;
		return true;
	}
}

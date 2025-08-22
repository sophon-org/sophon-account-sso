import type { JwtPayload } from "jsonwebtoken";

export type AccessTokenPayload = JwtPayload & {
	aud: string;
	userId: string;
	scope: string; // space-separated
};

export type RefreshTokenPayload = JwtPayload & {
	aud: string;
	userId: string;
	scope: string;
	sid?: string;
	jti?: string;
};

export interface AuthenticatedRequest extends Request {
	user: AccessTokenPayload;
}

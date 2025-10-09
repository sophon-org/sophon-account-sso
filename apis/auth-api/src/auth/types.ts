import type { JwtPayload } from "jsonwebtoken";
export type ConsentKeyShort = "pa" | "sd"; // pa=PERSONALIZATION_ADS, sd=SHARING_DATA
export type ConsentClaims = Partial<Record<ConsentKeyShort, number>>; // epoch seconds

import type { Request } from "express";

export type AccessTokenPayload = JwtPayload & {
	sub: string;
	aud: string;
	userId: string;
	scope: string; // space-separated
	c?: ConsentClaims;
	typ?: "access";
};

export type RefreshTokenPayload = JwtPayload & {
	sub: string;
	aud: string;
	userId: string;
	scope: string;
	sid: string;
	jti: string;
	typ?: "refresh";
};

export interface AuthenticatedRequest extends Request {
	user: AccessTokenPayload;
}

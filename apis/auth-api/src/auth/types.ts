import type { JwtPayload } from "jsonwebtoken";
export type ConsentKeyShort = "pa" | "sd"; // pa=PERSONALIZATION_ADS, sd=SHARING_DATA
export type ConsentClaims = Partial<Record<ConsentKeyShort, number>>; // epoch seconds

export type AccessTokenPayload = JwtPayload & {
	aud: string;
	userId: string;
	scope: string; // space-separated
	c?: ConsentClaims;
};

export type RefreshTokenPayload = JwtPayload & {
	aud: string;
	userId: string;
	scope: string;
	sid: string;
	jti: string;
};

export interface AuthenticatedRequest extends Request {
	user: AccessTokenPayload;
}

import { registerAs } from "@nestjs/config";
import { req, reqInt } from "./env.util";

export const authConfig = registerAs("auth", () => ({
	accessTtlS: reqInt("ACCESS_TTL_S"),
	refreshTtlS: reqInt("REFRESH_TTL_S"),
	nonceTtlS: reqInt("NONCE_TTL_S"),

	jwtKid: req("JWT_KID"),
	jwtIssuer: req("JWT_ISSUER"),
	nonceIssuer: req("NONCE_ISSUER"),
	refreshIssuer: req("REFRESH_ISSUER"),
	refreshJwtKid: req("REFRESH_JWT_KID"),

	cookieDomain: process.env.COOKIE_DOMAIN || undefined,
	cookieAccessMaxAgeS: reqInt("COOKIE_ACCESS_MAX_AGE_S"),
	cookieRefreshMaxAgeS: reqInt("COOKIE_REFRESH_MAX_AGE_S"),

	jwtAudience: process.env.JWT_AUDIENCE || undefined,
	partnerCdn: process.env.PARTNER_CDN || "https://cdn.sophon.xyz/partners/sdk",
}));
export type AuthConfig = ReturnType<typeof authConfig>;

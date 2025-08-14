export function getJwtKid(): string {
	const val = process.env.JWT_KID;
	if (!val) throw new Error("Missing required environment variable: JWT_KID");
	return val;
}

export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || "localhost";
export const JWT_ISSUER = process.env.JWT_ISSUER || "https://auth.sophon.xyz";
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "auth-api";

export const PARTNER_CDN =
	process.env.PARTNER_CDN || "https://cdn.sophon.xyz/partners/sdk";

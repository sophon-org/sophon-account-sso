export type AppEnv = {
	ACCESS_TTL_S: number;
	REFRESH_TTL_S: number;
	NONCE_TTL_S: number;
	COOKIE_ACCESS_MAX_AGE_S: number;
	COOKIE_REFRESH_MAX_AGE_S: number;

	JWT_KID: string;
	JWT_ISSUER: string;
	NONCE_ISSUER: string;
	REFRESH_ISSUER: string;
	REFRESH_JWT_KID: string;

	COOKIE_DOMAIN?: string;
	JWT_AUDIENCE?: string;
	PARTNER_CDN: string;
	DATABASE_URL: string;
};

function reqStr(name: keyof AppEnv & string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing required env var: ${name}`);
	return v;
}

function reqNum(name: keyof AppEnv & string): number {
	const v = reqStr(name);
	const n = Number(v);
	if (!Number.isFinite(n))
		throw new Error(`Invalid number for env var: ${name}`);
	return n;
}

let cached: Readonly<AppEnv> | null = null;

export function getEnv(): Readonly<AppEnv> {
	if (cached) return cached;
	cached = Object.freeze({
		ACCESS_TTL_S: reqNum("ACCESS_TTL_S"),
		REFRESH_TTL_S: reqNum("REFRESH_TTL_S"),
		NONCE_TTL_S: reqNum("NONCE_TTL_S"),
		COOKIE_ACCESS_MAX_AGE_S: reqNum("COOKIE_ACCESS_MAX_AGE_S"),
		COOKIE_REFRESH_MAX_AGE_S: reqNum("COOKIE_REFRESH_MAX_AGE_S"),

		JWT_KID: reqStr("JWT_KID"),
		JWT_ISSUER: reqStr("JWT_ISSUER"),
		NONCE_ISSUER: reqStr("NONCE_ISSUER"),
		REFRESH_ISSUER: reqStr("REFRESH_ISSUER"),
		REFRESH_JWT_KID: reqStr("REFRESH_JWT_KID"),

		COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
		JWT_AUDIENCE: process.env.JWT_AUDIENCE || undefined,
		PARTNER_CDN:
			process.env.PARTNER_CDN || "https://cdn.sophon.xyz/partners/sdk",
		DATABASE_URL: reqStr("DATABASE_URL"),
	});
	return cached;
}

export function getJwtKid(): string {
	return getEnv().JWT_KID;
}
export function getJwtIssuer(): string {
	return getEnv().JWT_ISSUER;
}
export const COOKIE_DOMAIN = () => getEnv().COOKIE_DOMAIN;
export const JWT_AUDIENCE = () => getEnv().JWT_AUDIENCE;
export const DATABASE_URL = () => getEnv().DATABASE_URL;

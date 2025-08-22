import type { Request } from "express";

function getHeader(req: Request, name: string): string | undefined {
	const raw =
		(typeof req.get === "function" ? req.get(name) : undefined) ??
		(req.headers?.[name.toLowerCase()] as string | string[] | undefined);

	return Array.isArray(raw) ? raw[0] : raw;
}

export function extractRefreshToken(req: Request): string | undefined {
	const fromCookie = req.cookies?.refresh_token;
	const fromXHeader = getHeader(req, "x-refresh-token");
	const auth = getHeader(req, "authorization");
	const fromAuth = auth?.startsWith("Bearer ")
		? auth.slice("Bearer ".length)
		: undefined;

	return fromCookie || fromXHeader || fromAuth || undefined;
}

import type { Response } from "express";

export function setWwwAuthenticate(res: Response): void {
	res.set("WWW-Authenticate", 'Bearer realm="refresh", error="invalid_token"');
}

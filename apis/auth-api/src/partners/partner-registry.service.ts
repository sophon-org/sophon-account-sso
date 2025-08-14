import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { PARTNER_CDN } from "../config/env";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 2500; // 2.5s

@Injectable()
export class PartnerRegistryService {
	private cache = new Map<string, number>();

	/**
	 * Returns true if <PARTNER_CDN>/<partnerId>.json exists.
	 * Uses positive-result caching to reduce CDN load.
	 */
	async exists(partnerId: string): Promise<boolean> {
		if (
			process.env.NODE_ENV === "test" ||
			process.env.BYPASS_PARTNER_CDN_CHECK === "true"
		) {
			return true;
		}

		if (!PARTNER_CDN) {
			throw new InternalServerErrorException(
				"Server misconfiguration: PARTNER_CDN is not set",
			);
		}

		const id = String(partnerId ?? "").trim();
		if (!id) return false;

		const exp = this.cache.get(id);
		if (exp && exp > Date.now()) return true;

		const url = this.buildUrl(id);

		const ok =
			(await this.probe(url, "HEAD")) || (await this.probe(url, "GET"));
		if (ok) {
			this.cache.set(id, Date.now() + CACHE_TTL_MS);
		}
		return ok;
	}

	/**
	 * Throws a 4xx HttpException if the partner does not exist or input is invalid.
	 */
	async assertExists(partnerId: string): Promise<void> {
		const id = String(partnerId ?? "").trim();
		if (!id) {
			throw new BadRequestException("audience is required");
		}
		const ok = await this.exists(id);
		if (!ok) {
			throw new BadRequestException(`Audience not allowed: ${id}`);
		}
	}

	private buildUrl(partnerId: string): string {
		return `${PARTNER_CDN.replace(/\/+$/, "")}/${encodeURIComponent(
			partnerId,
		)}.json`;
	}

	private async probe(url: string, method: "HEAD" | "GET"): Promise<boolean> {
		// Node 18+ has global fetch; if you’re on older Node, install `undici` and import it.
		const ac = new AbortController();
		const t = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);

		try {
			const res = await fetch(url, {
				method,
				signal: ac.signal,
				headers: method === "GET" ? { accept: "application/json" } : undefined,
			});
			// Some CDNs return 403/405 for HEAD; treat those as “unknown” so GET can try.
			if (res.ok) return true;
			if (method === "HEAD" && (res.status === 403 || res.status === 405))
				return false;
			return false;
		} catch {
			return false;
		} finally {
			clearTimeout(t);
		}
	}
}

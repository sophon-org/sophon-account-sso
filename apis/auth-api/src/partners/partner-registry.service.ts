import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const DEFAULT_CDN = "https://cdn.sophon.xyz/partners/sdk";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 2500;

@Injectable()
export class PartnerRegistryService {
	private cache = new Map<string, number>();

	constructor(private readonly config: ConfigService) {}

	async exists(partnerId: string): Promise<boolean> {
		if (
			this.config.get("NODE_ENV") === "test" ||
			this.config.get("BYPASS_PARTNER_CDN_CHECK") === "true"
		) {
			return true;
		}

		const cdn =
			this.config.get<string>("partners.cdn") ??
			this.config.get<string>("auth.partnerCdn") ??
			this.config.get<string>("PARTNER_CDN") ??
			DEFAULT_CDN;

		const id = String(partnerId ?? "").trim();
		if (!id) return false;

		const exp = this.cache.get(id);
		if (exp && exp > Date.now()) return true;

		const url = `${cdn.replace(/\/+$/, "")}/${encodeURIComponent(id)}.json`;
		const ok =
			(await this.probe(url, "HEAD")) || (await this.probe(url, "GET"));
		if (ok) this.cache.set(id, Date.now() + CACHE_TTL_MS);
		return ok;
	}

	private async probe(url: string, method: "HEAD" | "GET"): Promise<boolean> {
		const ac = new AbortController();
		const t = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
		try {
			const res = await fetch(url, {
				method,
				signal: ac.signal,
				headers: method === "GET" ? { accept: "application/json" } : undefined,
			});
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

	async assertExists(partnerId: string): Promise<void> {
		const id = String(partnerId ?? "").trim();
		if (!id) throw new BadRequestException("audience is required");
		if (!(await this.exists(id))) {
			throw new BadRequestException(`Audience not allowed: ${id}`);
		}
	}
}

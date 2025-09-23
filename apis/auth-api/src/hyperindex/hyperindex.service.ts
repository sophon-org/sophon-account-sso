import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { hyperindexConfig } from "../config/hyperindex.config";

type K1OwnerState = {
	id: string;
	k1Owner: string;
	accounts: string[];
};

type GqlResp<T> = { data?: T; errors?: Array<{ message: string }> };

@Injectable()
export class HyperindexService {
	constructor(
		@Inject(hyperindexConfig.KEY)
		private readonly cfg: ConfigType<typeof hyperindexConfig>,
	) {}

	private async gql<T>(
		query: string,
		variables?: Record<string, unknown>,
	): Promise<T> {
		const controller = new AbortController();
		const t = setTimeout(() => controller.abort(), this.cfg.timeoutMs);

		try {
			const res = await fetch(this.cfg.graphqlUrl, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					...(this.cfg.apiKey
						? { authorization: `Bearer ${this.cfg.apiKey}` }
						: {}),
				},
				body: JSON.stringify({ query, variables }),
				signal: controller.signal,
			});

			const json = (await res.json()) as GqlResp<T>;

			if (!res.ok || json.errors?.length) {
				const msg =
					json.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
				throw new BadRequestException(`HyperIndex error: ${msg}`);
			}

			if (!json.data) {
				throw new BadRequestException("HyperIndex returned empty data");
			}

			return json.data;
		} catch (e) {
			if (e instanceof Error && e.name === "AbortError") {
				throw new BadRequestException("HyperIndex request timed out");
			}
			throw e;
		} finally {
			clearTimeout(t);
		}
	}

	/**
	 * Fetch K1OwnerState rows by exact k1Owner (case-insensitive).
	 * If you want partial matching later, add another method.
	 */
	async getK1OwnerStateByOwner(k1Owner: string): Promise<K1OwnerState[]> {
		const addr = this.normalizeAddress(k1Owner);
		if (!addr) {
			throw new BadRequestException("Invalid k1Owner address");
		}

		// Hasura-style filtering (HyperIndex commonly exposes Hasura)
		const query = /* GraphQL */ `
      query ($k1Owner: String!) {
        K1OwnerState(where: { k1Owner: { _eq: $k1Owner } }) {
          id
          k1Owner
          accounts
        }
      }
    `;

		const data = await this.gql<{ K1OwnerState: K1OwnerState[] }>(query, {
			k1Owner: this.normalizeAddress(addr),
		});

		return data.K1OwnerState ?? [];
	}

	private normalizeAddress(s: string | undefined | null): string | null {
		const v = (s ?? "").trim().toLowerCase();
		if (/^0x[0-9a-f]{40}$/.test(v)) return v;
		return null;
	}
}

import {
	BadGatewayException,
	GatewayTimeoutException,
	Injectable,
} from "@nestjs/common";
import { Address } from "viem";
import { hyperIndexerByChain } from "../config/hyperindex.config";

type K1OwnerState = {
	id: string;
	k1Owner: Address;
	accounts: Address[];
};

type GqlResp<T> = { data?: T; errors?: Array<{ message: string }> };

@Injectable()
export class HyperindexService {
	private async gql<T>(
		query: string,
		chainId: number,
		variables?: Record<string, unknown>,
	): Promise<T> {
		const config = hyperIndexerByChain[chainId];
		if (!config) {
			throw new BadGatewayException(
				`HyperIndex config not found for chainId ${chainId}`,
			);
		}

		try {
			const res = await fetch(config.graphqlUrl, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					...(config.apiKey
						? { authorization: `Bearer ${config.apiKey}` }
						: {}),
				},
				body: JSON.stringify({ query, variables }),

				signal: AbortSignal.timeout(config.timeoutMs),
			});

			if (!res.ok) {
				throw new BadGatewayException(`HyperIndex HTTP ${res.status}`);
			}

			let json: GqlResp<T>;
			try {
				json = (await res.json()) as GqlResp<T>;
			} catch {
				throw new BadGatewayException("HyperIndex returned non-JSON");
			}

			if (json.errors?.length) {
				throw new BadGatewayException("HyperIndex GraphQL error");
			}
			if (!json.data) {
				throw new BadGatewayException("HyperIndex returned empty data");
			}

			return json.data;
		} catch (e: unknown) {
			if (
				e instanceof Error &&
				(e.name === "TimeoutError" || e.name === "AbortError")
			) {
				throw new GatewayTimeoutException("HyperIndex request timed out");
			}
			throw e;
		}
	}

	/**
	 * Fetch K1OwnerState rows by exact k1Owner ( lowercasing).
	 * Ensure indexer stores lowercase; .
	 */
	async getK1OwnerStateByOwner(
		k1Owner: string,
		chainId: number,
	): Promise<K1OwnerState[]> {
		const addr = this.normalizeAddress(k1Owner);
		if (!addr) {
			throw new BadGatewayException("Invalid k1Owner address");
		}

		const query = /* GraphQL */ `
      query ($k1Owner: String!) {
        K1OwnerState(where: { k1Owner: { _eq: $k1Owner } }) {
          id
          k1Owner
          accounts
        }
      }
    `;

		const data = await this.gql<{ K1OwnerState: K1OwnerState[] }>(
			query,
			chainId,
			{
				k1Owner: this.normalizeAddress(addr),
			},
		);

		return data.K1OwnerState ?? [];
	}

	private normalizeAddress(s: string | undefined | null): string | null {
		const v = (s ?? "").trim().toLowerCase();
		return /^0x[0-9a-f]{40}$/.test(v) ? v : null;
	}
}

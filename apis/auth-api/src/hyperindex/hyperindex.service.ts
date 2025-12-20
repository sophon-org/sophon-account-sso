import {
	BadGatewayException,
	GatewayTimeoutException,
	Inject,
	Injectable,
	Logger,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Address, keccak256, toHex } from "viem";
import { hyperindexConfig } from "../config/hyperindex.config";

type K1OwnerState = {
	id: string;
	k1Owner: Address;
	accounts: Address[];
};

type GqlResp<T> = { data?: T; errors?: Array<{ message: string }> };

@Injectable()
export class HyperindexService {
	private logger = new Logger(HyperindexService.name);

	constructor(
		@Inject(hyperindexConfig.KEY)
		private readonly cfg: ConfigType<typeof hyperindexConfig>,
	) {
		if (this.cfg.mockMode) {
			this.logger.log("HyperindexService initialized in MOCK MODE");
		}
	}

	private async gql<T>(
		query: string,
		variables?: Record<string, unknown>,
	): Promise<T> {
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

				signal: AbortSignal.timeout(this.cfg.timeoutMs),
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
	async getK1OwnerStateByOwner(k1Owner: string): Promise<K1OwnerState[]> {
		const addr = this.normalizeAddress(k1Owner);
		if (!addr) {
			throw new BadGatewayException("Invalid k1Owner address");
		}

		// Mock mode: return deterministic mock smart wallet address
		if (this.cfg.mockMode) {
			const mockSmartWallet = this.generateMockSmartWallet(addr);
			this.logger.debug(
				`Mock mode: returning mock smart wallet ${mockSmartWallet} for owner ${addr}`,
			);
			return [
				{
					id: `mock-${addr}`,
					k1Owner: addr as Address,
					accounts: [mockSmartWallet as Address],
				},
			];
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

		const data = await this.gql<{ K1OwnerState: K1OwnerState[] }>(query, {
			k1Owner: this.normalizeAddress(addr),
		});

		return data.K1OwnerState ?? [];
	}

	/**
	 * Generate a deterministic mock smart wallet address from owner address
	 */
	private generateMockSmartWallet(ownerAddress: string): string {
		const hash = keccak256(toHex(`mock-smart-wallet:${ownerAddress}`));
		return hash.slice(0, 42); // Return first 20 bytes as address
	}

	private normalizeAddress(s: string | undefined | null): string | null {
		const v = (s ?? "").trim().toLowerCase();
		return /^0x[0-9a-f]{40}$/.test(v) ? v : null;
	}
}

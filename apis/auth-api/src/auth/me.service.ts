import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	ServiceUnavailableException,
} from "@nestjs/common";
import type { JwtPayload } from "jsonwebtoken";
import { SecretsService } from "src/aws/secrets.service";
import {
	type PermissionAllowedField,
	unpackScope,
} from "../config/permission-allowed-fields";
import { MeFieldsDto, MeResponseDto } from "./dto/me-response.dto";

/** Minimal shape of what we read from DynamicAuth */
type DynamicAuthUser = {
	user?: {
		id?: string;
		email?: string | null;
		oauthAccounts?: Array<{
			provider?: string;
			accountUsername?: string | null;
		}>;
		verifiedCredentials?: Array<{
			email?: string | null;
			oauth_emails?: string[] | undefined;
		}>;
	};
};

const REQ_TIMEOUT_MS = 3000;

@Injectable()
export class MeService {
	private readonly baseUrl =
		process.env.DYNAMICAUTH_BASE_URL ?? "https://app.dynamicauth.com";
	private readonly envId = process.env.DYNAMICAUTH_ENV_ID as string;

	constructor(private readonly secrets: SecretsService) {}

	/**
	 * Build /auth/me response using:
	 * - access token claims (sub/aud/iss/scope, userId REQUIRED)
	 * - DynamicAuth user profile (optional fields gated by scope)
	 */
	async buildMeResponse(payload: JwtPayload): Promise<MeResponseDto> {
		const apiToken =
			(process.env.DYNAMICAUTH_API_TOKEN as string) ??
			(await this.secrets.loadAWSSecrets()).dynamicToken;
		this.ensureConfigured(apiToken);

		const userId = this.pickUserId(payload);
		const user = await this.fetchDynamicAuthUser(userId, apiToken);

		const scope = (payload as unknown as { scope?: string }).scope ?? "";
		const scopeArr = unpackScope(scope);

		const fields: MeFieldsDto = {};
		for (const f of scopeArr) {
			fields[f] = this.resolveFieldValue(f, user);
		}

		return {
			sub: (payload.sub as string) ?? "",
			aud: (payload.aud as string) ?? "",
			iss: (payload.iss as string) ?? "",
			scope: scopeArr,
			fields,
			exp: typeof payload.exp === "number" ? payload.exp : undefined,
			iat: typeof payload.iat === "number" ? payload.iat : undefined,
		};
	}

	private ensureConfigured(apiToken: string): void {
		if (!this.envId || !apiToken) {
			throw new InternalServerErrorException(
				"DynamicAuth is not configured (DYNAMICAUTH_ENV_ID / DYNAMICAUTH_API_TOKEN).",
			);
		}
	}

	private pickUserId(payload: JwtPayload): string {
		const tokenUserId = (payload as JwtPayload & { userId?: unknown }).userId;
		if (typeof tokenUserId !== "string" || tokenUserId.trim() === "") {
			throw new BadRequestException("userId is missing in access token.");
		}
		return tokenUserId;
	}

	private async fetchDynamicAuthUser(
		userId: string,
		apiToken: string,
	): Promise<DynamicAuthUser["user"]> {
		const url = `${this.baseUrl.replace(/\/+$/, "")}/api/v0/environments/${encodeURIComponent(
			this.envId,
		)}/users/${encodeURIComponent(userId)}`;

		const ac = new AbortController();
		const timer = setTimeout(() => ac.abort(), REQ_TIMEOUT_MS);

		try {
			const res = await fetch(url, {
				method: "GET",
				signal: ac.signal,
				headers: {
					Authorization: `Bearer ${apiToken}`,
					Accept: "application/json",
				},
			});

			if (!res.ok) {
				const text = await safeText(res);
				throw new ServiceUnavailableException(
					`DynamicAuth request failed (${res.status}): ${truncate(text)}`,
				);
			}

			const data = (await res.json()) as DynamicAuthUser;
			return data.user ?? {};
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") {
				throw new ServiceUnavailableException("DynamicAuth request timed out.");
			}
			if (err instanceof ServiceUnavailableException) throw err;
			throw new ServiceUnavailableException("DynamicAuth request failed.");
		} finally {
			clearTimeout(timer);
		}
	}

	private resolveFieldValue(
		field: PermissionAllowedField,
		user: DynamicAuthUser["user"],
	): string | null {
		switch (field) {
			case "email":
				return this.resolveEmail(user);

			case "discord":
				return this.getOauthUsername(user, ["discord"]);

			case "google":
				return this.getOauthUsername(user, ["google"]);

			case "telegram":
				return this.getOauthUsername(user, ["telegram"]);

			case "x":
				// Sometimes providers use "twitter"
				return this.getOauthUsername(user, ["x", "twitter"]);

			default:
				return null;
		}
	}

	private resolveEmail(user: DynamicAuthUser["user"]): string | null {
		// 1) top-level email
		const topLevel = typeof user?.email === "string" ? user.email : undefined;

		// 2) emails from verified credentials
		const vcEmails: Array<string | null | undefined> = (
			user?.verifiedCredentials ?? []
		).map((vc) => vc.email);

		// 3) oauth_emails from verified credentials
		const vcOauthEmails: string[] = (user?.verifiedCredentials ?? []).flatMap(
			(vc) => vc.oauth_emails ?? [],
		);

		const first = firstNonEmptyString(topLevel, ...vcEmails, ...vcOauthEmails);
		return first ?? null;
	}

	private getOauthUsername(
		user: DynamicAuthUser["user"],
		providerNames: string[],
	): string | null {
		const accounts = user?.oauthAccounts ?? [];
		const match = accounts.find((a) =>
			providerNames.includes((a.provider ?? "").toLowerCase()),
		);
		return (match?.accountUsername ?? null) || null;
	}
}

function firstNonEmptyString(
	...vals: Array<string | null | undefined>
): string | undefined {
	for (const v of vals) {
		if (typeof v === "string" && v.trim() !== "") return v;
	}
	return undefined;
}

async function safeText(res: Response): Promise<string> {
	try {
		return await res.text();
	} catch {
		return "";
	}
}

function truncate(s: string, n = 200): string {
	return s.length > n ? `${s.slice(0, n)}…` : s;
}

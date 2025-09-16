import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { AwsConfig, awsConfig } from "../config/aws.config";

export type JwtSecrets = {
	access: { kid: string; privateKeyPem: string; publicKeyPem: string };
	refresh: { kid: string; privateKeyPem: string; publicKeyPem: string };
	databaseUrl?: string;
	dynamicToken?: string;
};

@Injectable()
export class SecretsService {
	private client: SecretsManagerClient;
	private cache: { value: JwtSecrets; ts: number } | null = null;

	constructor(@Inject(awsConfig.KEY) private readonly cfg: AwsConfig) {
		this.client = new SecretsManagerClient({
			region: this.cfg.region,
		});
	}

	private normalize(v: string) {
		return v?.includes("\\n") ? v.replace(/\\n/g, "\n") : v;
	}

	async loadJwtSecrets(): Promise<JwtSecrets> {
		if (this.cache && Date.now() - this.cache.ts < this.cfg.secretsCacheTtlMs) {
			return this.cache.value;
		}

		const res = await this.client.send(
			new GetSecretValueCommand({
				SecretId: this.cfg.secretIdJwtKeys,
				VersionStage: "AWSCURRENT",
			}),
		);

		const raw =
			res.SecretString ??
			(res.SecretBinary ? Buffer.from(res.SecretBinary).toString("utf-8") : "");

		if (!raw) {
			throw new InternalServerErrorException("AWS secret string is empty");
		}

		const s = JSON.parse(raw);

		const out: JwtSecrets = {
			access: {
				kid: s.JWT_ACCESS_KEY_ID,
				privateKeyPem: this.normalize(s.JWT_ACCESS_PRIVATE_KEY),
				publicKeyPem: this.normalize(s.JWT_ACCESS_PUBLIC_KEY),
			},
			refresh: {
				kid: s.JWT_REFRESH_KEY_ID,
				privateKeyPem: this.normalize(s.JWT_REFRESH_PRIVATE_KEY),
				publicKeyPem: this.normalize(s.JWT_REFRESH_PUBLIC_KEY),
			},
			databaseUrl: s.DATABASE_URL,
			dynamicToken: s.DYNAMICAUTH_API_TOKEN,
		};

		this.cache = { value: out, ts: Date.now() };
		return out;
	}
}

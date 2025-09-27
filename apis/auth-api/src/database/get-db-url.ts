import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export async function getDbUrl(): Promise<string> {
	// Prefer direct env when present
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const secretId =
		process.env.DB_URL_SECRET_ID ||
		process.env.AUTH_DB_SECRET_ID ||
		process.env.POSTGRES_URL_SECRET_ID;

	if (!secretId) {
		throw new Error(
			"Missing DB secret id. Set one of: DB_URL_SECRET_ID, AUTH_DB_SECRET_ID, POSTGRES_URL_SECRET_ID, or set DATABASE_URL.",
		);
	}

	const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

	const client = new SecretsManagerClient({
		region: AWS_REGION,
		credentials:
			AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
				? {
						accessKeyId: AWS_ACCESS_KEY_ID,
						secretAccessKey: AWS_SECRET_ACCESS_KEY,
					}
				: undefined,
	});

	const out = await client.send(
		new GetSecretValueCommand({ SecretId: secretId }),
	);

	const binaryUtf8 =
		out.SecretBinary instanceof Uint8Array
			? Buffer.from(out.SecretBinary).toString("utf8")
			: undefined;

	const raw = out.SecretString ?? binaryUtf8;

	if (!raw) throw new Error(`Secret '${secretId}' has no value`);

	// Allow plain string or JSON object with common keys
	try {
		const j = JSON.parse(raw);
		return j.DATABASE_URL || j.url || j.connectionString || raw;
	} catch {
		return raw;
	}
}

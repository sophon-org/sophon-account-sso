import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export type JwtSecrets = {
	access: { kid: string; privateKeyPem: string; publicKeyPem: string };
	refresh: { kid: string; privateKeyPem: string; publicKeyPem: string };
	databaseUrl: string;
	dynamicToken: string;
};

const sm = new SecretsManagerClient({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
	},
});
const stage = (
	process.env.APP_ENV ??
	process.env.NODE_ENV ??
	"staging"
).toLowerCase();

const DEFAULT_SECRET_ID = `sophon/${stage}/auth`;

const SECRET_ID = process.env.SECRET_ID_JWT_KEYS || DEFAULT_SECRET_ID;
const CACHE_TTL_MS = Number(process.env.SECRETS_CACHE_TTL_MS ?? 300000);

let cache: { value: JwtSecrets; timestamp: number } | null = null;

const normalize = (value: string) =>
	value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;

export async function loadJwtSecrets(): Promise<JwtSecrets> {
	console.log("loadJwtSecrets");
	if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) return cache.value;

	const res = await sm.send(
		new GetSecretValueCommand({
			SecretId: SECRET_ID,
			VersionStage: "AWSCURRENT",
		}),
	);
	const str =
		res.SecretString ??
		(res.SecretBinary ? Buffer.from(res.SecretBinary).toString("utf-8") : "");
	if (!str) throw new Error("SecretString is empty");

	const remoteSecret = JSON.parse(str);

	const secret: JwtSecrets = {
		access: {
			kid: remoteSecret.JWT_ACCESS_KEY_ID,
			privateKeyPem: normalize(remoteSecret.JWT_ACCESS_PRIVATE_KEY),
			publicKeyPem: normalize(remoteSecret.JWT_ACCESS_PUBLIC_KEY),
		},
		refresh: {
			kid: remoteSecret.JWT_REFRESH_KEY_ID,
			privateKeyPem: normalize(remoteSecret.JWT_ACCESS_PRIVATE_KEY),
			publicKeyPem: normalize(remoteSecret.JWT_ACCESS_PUBLIC_KEY),
		},
		databaseUrl: remoteSecret.DATABASE_URL,
		dynamicToken: remoteSecret.DYNAMICAUTH_API_TOKEN,
	};

	cache = { value: secret, timestamp: Date.now() };

	return secret;
}

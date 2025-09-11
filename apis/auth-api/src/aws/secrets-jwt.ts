import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export type JwtSecrets = {
	access: { kid: string; privateKeyPem: string; publicKeyPem: string };
	refresh: { kid: string; privateKeyPem: string; publicKeyPem: string };
};

const sm = new SecretsManagerClient({ region: process.env.AWS_REGION });
const stage = (
	process.env.APP_ENV ??
	process.env.NODE_ENV ??
	"development"
).toLowerCase();
const derivedId =
	stage === "production"
		? "sophon/prod/auth/jwt-keys"
		: stage === "staging"
			? "sophon/staging/auth/jwt-keys"
			: "sophon/dev/auth/jwt-keys";

const SECRET_ID = process.env.SECRET_ID_JWT_KEYS || derivedId;
const CACHE_TTL_MS = Number(process.env.SECRETS_CACHE_TTL_MS ?? 300000);

let cache: { v: JwtSecrets; t: number } | null = null;
const norm = (p: string) => (p.includes("\\n") ? p.replace(/\\n/g, "\n") : p);

export async function loadJwtSecrets(): Promise<JwtSecrets> {
	if (cache && Date.now() - cache.t < CACHE_TTL_MS) return cache.v;

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

	const s = JSON.parse(str) as JwtSecrets;
	s.access.privateKeyPem = norm(s.access.privateKeyPem);
	s.access.publicKeyPem = norm(s.access.publicKeyPem);
	s.refresh.privateKeyPem = norm(s.refresh.privateKeyPem);
	s.refresh.publicKeyPem = norm(s.refresh.publicKeyPem);

	cache = { v: s, t: Date.now() };
	return s;
}

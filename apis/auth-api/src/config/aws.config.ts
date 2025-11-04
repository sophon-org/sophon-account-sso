import { registerAs } from "@nestjs/config";

const stage = (
	process.env.APP_ENV ??
	process.env.NODE_ENV ??
	"staging"
).toLowerCase();

export const awsConfig = registerAs("aws", () => ({
	region: process.env.AWS_REGION ?? "eu-central-1",
	accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,

	secretIdJwtKeys: process.env.SECRET_ID_JWT_KEYS ?? `sophon/${stage}/auth`,
	secretsCacheTtlMs: Number.parseInt(
		process.env.SECRETS_CACHE_TTL_MS ?? "300000",
		10,
	),
	redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
}));

export type AwsConfig = ReturnType<typeof awsConfig>;

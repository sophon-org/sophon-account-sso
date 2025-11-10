import { registerAs } from "@nestjs/config";

export const dbConfig = registerAs("db", () => ({
	url: process.env.DATABASE_URL,
	redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
}));
export type DbConfig = ReturnType<typeof dbConfig>;

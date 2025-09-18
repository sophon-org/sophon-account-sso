import { registerAs } from "@nestjs/config";

export const dbConfig = registerAs("db", () => ({
	url: process.env.DATABASE_URL,
}));
export type DbConfig = ReturnType<typeof dbConfig>;

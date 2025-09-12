import { registerAs } from "@nestjs/config";
import { req } from "./env.util";

export const dbConfig = registerAs("db", () => ({
	url: req("DATABASE_URL"),
}));
export type DbConfig = ReturnType<typeof dbConfig>;
